
import { getCurrentUserTenantId } from "@/integrations/supabase/client";

/**
 * Validates that operations are performed within proper tenant context
 */
export const validateTenantContext = async (operation: string, data?: any): Promise<boolean> => {
  try {
    const currentTenantId = await getCurrentUserTenantId();
    
    if (!currentTenantId) {
      logTenantSecurityEvent('MISSING_TENANT_CONTEXT', {
        operation,
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    // If data includes tenant_id, validate it matches current tenant
    if (data?.tenant_id && data.tenant_id !== currentTenantId) {
      logTenantSecurityEvent('CROSS_TENANT_OPERATION_BLOCKED', {
        operation,
        currentTenant: currentTenantId,
        attemptedTenant: data.tenant_id,
        timestamp: new Date().toISOString()
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`TENANT_SECURITY_ERROR: Error validating context for ${operation}`, error);
    return false;
  }
};

/**
 * Enhanced tenant access validation with detailed logging
 */
export const validateTenantAccess = async (requiredTenantId?: string | null): Promise<boolean> => {
  try {
    const currentTenantId = await getCurrentUserTenantId();
    
    if (!currentTenantId) {
      console.error("TENANT_SECURITY_WARNING: No tenant ID found for current user");
      return false;
    }
    
    if (requiredTenantId && requiredTenantId !== currentTenantId) {
      console.error("TENANT_SECURITY_WARNING: Attempted cross-tenant access", {
        currentTenant: currentTenantId,
        requestedTenant: requiredTenantId
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("TENANT_SECURITY_ERROR: Error validating tenant access", error);
    return false;
  }
};

/**
 * Gets the current tenant ID with validation
 */
export const getCurrentTenantIdSafe = async (): Promise<string | null> => {
  try {
    const tenantId = await getCurrentUserTenantId();
    
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
 * Logs potential security issues related to tenant access
 */
export const logTenantSecurityEvent = (event: string, details: any) => {
  console.warn(`TENANT_SECURITY_EVENT: ${event}`, details);
};

/**
 * Validates tenant isolation before database operations
 */
export const validateTenantIsolation = async (operationType: string, targetTenantId?: string): Promise<boolean> => {
  try {
    const currentTenantId = await getCurrentUserTenantId();
    
    if (!currentTenantId) {
      console.error("TENANT_SECURITY_ERROR: Cannot perform operation without tenant context", {
        operation: operationType
      });
      return false;
    }
    
    if (targetTenantId && targetTenantId !== currentTenantId) {
      console.error("TENANT_SECURITY_ERROR: Cross-tenant operation attempt blocked", {
        operation: operationType,
        currentTenant: currentTenantId,
        targetTenant: targetTenantId
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("TENANT_SECURITY_ERROR: Exception during tenant isolation validation", error);
    return false;
  }
};
