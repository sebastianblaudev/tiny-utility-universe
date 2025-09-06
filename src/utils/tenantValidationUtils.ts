import { supabase } from '@/integrations/supabase/client';
import { getCurrentUserTenantId } from "@/lib/supabase-helpers";

/**
 * Enhanced tenant ID management with multiple fallback strategies
 */
export const getTenantIdWithFallbacks = async (): Promise<string | null> => {
  try {
    // Strategy 1: Get from current auth context
    const currentTenantId = await getCurrentUserTenantId();
    if (currentTenantId) {
      // Store in localStorage for future fallback
      localStorage.setItem('current_tenant_id', currentTenantId);
      localStorage.setItem('tenant_id_timestamp', Date.now().toString());
      return currentTenantId;
    }

    // Strategy 2: Get from localStorage (cached)
    const cachedTenantId = localStorage.getItem('current_tenant_id');
    const cacheTimestamp = localStorage.getItem('tenant_id_timestamp');
    
    // Check if cache is not too old (24 hours)
    if (cachedTenantId && cacheTimestamp) {
      const cacheAge = Date.now() - parseInt(cacheTimestamp);
      const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
      
      if (cacheAge < maxCacheAge) {
        // Removed repetitive log message to reduce console spam
        return cachedTenantId;
      }
    }

    // Strategy 3: Get from sessionStorage
    const sessionTenantId = sessionStorage.getItem('session_tenant_id');
    if (sessionTenantId) {
      // Update localStorage cache
      localStorage.setItem('current_tenant_id', sessionTenantId);
      localStorage.setItem('tenant_id_timestamp', Date.now().toString());
      return sessionTenantId;
    }

    // Strategy 4: Try to recover from user session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.user_metadata?.tenant_id) {
      const recoveredTenantId = session.user.user_metadata.tenant_id;
      console.log('TENANT_ID: Tenant ID recovered automatically');
      
      // Cache the recovered ID
      localStorage.setItem('current_tenant_id', recoveredTenantId);
      sessionStorage.setItem('session_tenant_id', recoveredTenantId);
      localStorage.setItem('tenant_id_timestamp', Date.now().toString());
      
      return recoveredTenantId;
    }

    console.warn('TENANT_ID_WARNING: No tenant ID found with any fallback strategy');
    logTenantEvent('TENANT_ID_MISSING', { 
      strategies_attempted: ['current_auth', 'localStorage', 'sessionStorage', 'user_session'],
      timestamp: new Date().toISOString()
    });
    
    return null;
  } catch (error) {
    console.error('TENANT_ID_ERROR: Error in getTenantIdWithFallbacks', error);
    logTenantEvent('TENANT_ID_ERROR', { error: error.toString(), timestamp: new Date().toISOString() });
    return null;
  }
};

/**
 * Validates that operations are performed within proper tenant context with retry logic
 */
export const validateTenantContext = async (operation: string, data?: any, retries: number = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const currentTenantId = await getTenantIdWithFallbacks();
      
      if (!currentTenantId) {
        logTenantEvent('MISSING_TENANT_CONTEXT', {
          operation,
          attempt,
          timestamp: new Date().toISOString()
        });
        
        if (attempt === retries) {
          return false;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      // If data includes tenant_id, validate it matches current tenant
      if (data?.tenant_id && data.tenant_id !== currentTenantId) {
        logTenantEvent('CROSS_TENANT_OPERATION_BLOCKED', {
          operation,
          currentTenant: currentTenantId,
          attemptedTenant: data.tenant_id,
          timestamp: new Date().toISOString()
        });
        return false;
      }
      
      // Success
      if (attempt > 1) {
        logTenantEvent('TENANT_CONTEXT_RECOVERED', {
          operation,
          attempt,
          tenantId: currentTenantId,
          timestamp: new Date().toISOString()
        });
      }
      
      return true;
    } catch (error) {
      console.error(`TENANT_SECURITY_ERROR: Error validating context for ${operation} (attempt ${attempt})`, error);
      
      if (attempt === retries) {
        return false;
      }
    }
  }
  
  return false;
};

/**
 * Enhanced tenant access validation with detailed logging and recovery
 */
export const validateTenantAccess = async (requiredTenantId?: string | null): Promise<boolean> => {
  try {
    const currentTenantId = await getTenantIdWithFallbacks();
    
    if (!currentTenantId) {
      console.error("TENANT_SECURITY_WARNING: No tenant ID found for current user");
      logTenantEvent('NO_TENANT_ACCESS', { 
        requiredTenantId, 
        timestamp: new Date().toISOString() 
      });
      return false;
    }
    
    if (requiredTenantId && requiredTenantId !== currentTenantId) {
      console.error("TENANT_SECURITY_WARNING: Attempted cross-tenant access", {
        currentTenant: currentTenantId,
        requestedTenant: requiredTenantId
      });
      logTenantEvent('CROSS_TENANT_ACCESS_BLOCKED', {
        currentTenant: currentTenantId,
        requestedTenant: requiredTenantId,
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("TENANT_SECURITY_ERROR: Error validating tenant access", error);
    logTenantEvent('TENANT_ACCESS_ERROR', { 
      error: error.toString(), 
      timestamp: new Date().toISOString() 
    });
    return false;
  }
};

/**
 * Gets the current tenant ID with validation and caching
 */
export const getCurrentTenantIdSafe = async (): Promise<string | null> => {
  try {
    const tenantId = await getTenantIdWithFallbacks();
    
    if (!tenantId) {
      console.error("TENANT_SECURITY_WARNING: No tenant ID available");
      return null;
    }
    
    return tenantId;
  } catch (error) {
    console.error("TENANT_SECURITY_ERROR: Error getting tenant ID", error);
    return null;
  }
};

/**
 * Logs tenant-related events for monitoring and debugging
 */
export const logTenantEvent = (event: string, details: any) => {
  const logEntry = {
    event: `TENANT_EVENT: ${event}`,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
  
  console.warn(logEntry.event, logEntry);
  
  // Store in localStorage for debugging (keep last 50 entries)
  try {
    const logs = JSON.parse(localStorage.getItem('tenant_event_logs') || '[]');
    logs.push(logEntry);
    
    // Keep only last 50 entries
    if (logs.length > 50) {
      logs.splice(0, logs.length - 50);
    }
    
    localStorage.setItem('tenant_event_logs', JSON.stringify(logs));
  } catch (error) {
    console.error('Error storing tenant event log:', error);
  }
};

/**
 * Gets recent tenant events for debugging
 */
export const getRecentTenantEvents = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('tenant_event_logs') || '[]');
  } catch (error) {
    console.error('Error retrieving tenant event logs:', error);
    return [];
  }
};

/**
 * Clears tenant event logs
 */
export const clearTenantEventLogs = (): void => {
  try {
    localStorage.removeItem('tenant_event_logs');
    console.log('Tenant event logs cleared');
  } catch (error) {
    console.error('Error clearing tenant event logs:', error);
  }
};
