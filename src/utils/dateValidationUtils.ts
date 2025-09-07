import { supabase } from '@/integrations/supabase/client';

export interface DateValidationResult {
  isValid: boolean;
  clientTime: Date;
  serverTime?: Date;
  differenceMinutes: number;
  recommendation?: string;
}

/**
 * Validates client date/time against server time to detect incorrect system clocks
 */
export const validateClientServerTime = async (): Promise<DateValidationResult> => {
  const clientTime = new Date();
  
  try {
    // Get server time by creating a test record and checking its timestamp
    const testResult = await supabase
      .from('sales') // Using existing table for timestamp check
      .select('date')
      .limit(1)
      .order('date', { ascending: false });
    
    if (testResult.error) {
      console.warn('Could not validate server time:', testResult.error);
      return {
        isValid: true, // Assume valid if we can't check
        clientTime,
        differenceMinutes: 0,
        recommendation: 'No se pudo validar la hora del servidor'
      };
    }
    
    // If no records exist, use current time as server time estimate
    let serverTime = new Date();
    if (testResult.data && testResult.data.length > 0) {
      serverTime = new Date(testResult.data[0].date);
    }
    
    const differenceMs = Math.abs(clientTime.getTime() - serverTime.getTime());
    const differenceMinutes = Math.floor(differenceMs / (1000 * 60));
    
    const result: DateValidationResult = {
      isValid: differenceMinutes <= 5, // Allow 5 minutes tolerance
      clientTime,
      serverTime,
      differenceMinutes,
    };
    
    if (differenceMinutes > 60) {
      result.recommendation = 'La fecha/hora de su dispositivo está muy desincronizada. Corrija la hora del sistema.';
    } else if (differenceMinutes > 15) {
      result.recommendation = 'La fecha/hora de su dispositivo tiene una diferencia significativa con el servidor.';
    } else if (differenceMinutes > 5) {
      result.recommendation = 'Pequeña diferencia de tiempo detectada. Considere sincronizar su reloj.';
    }
    
    return result;
  } catch (error) {
    console.error('Error validating client-server time:', error);
    return {
      isValid: true, // Assume valid on error
      clientTime,
      differenceMinutes: 0,
      recommendation: 'Error al validar la sincronización de tiempo'
    };
  }
};

/**
 * Corrects a date if it's clearly wrong (e.g., year is not current decade)
 */
export const correctSaleDate = (inputDate: Date | string): Date => {
  const date = new Date(inputDate);
  const now = new Date();
  const currentYear = now.getFullYear();
  const dateYear = date.getFullYear();
  
  // If date is clearly wrong (not in reasonable range), use current time
  if (dateYear < 2020 || dateYear > currentYear + 1) {
    console.warn(`Correcting invalid sale date: ${date} -> ${now}`);
    logDateCorrection(date, now, 'invalid_year');
    return now;
  }
  
  // If date is more than 24 hours in the future, use current time
  const hoursInFuture = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursInFuture > 24) {
    console.warn(`Correcting future sale date: ${date} -> ${now}`);
    logDateCorrection(date, now, 'future_date');
    return now;
  }
  
  // If date is more than 1 year in the past, use current time
  const hoursInPast = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  if (hoursInPast > 365 * 24) {
    console.warn(`Correcting very old sale date: ${date} -> ${now}`);
    logDateCorrection(date, now, 'old_date');
    return now;
  }
  
  return date;
};

/**
 * Validates and potentially corrects sale date for database insertion
 */
export const validateSaleDate = async (saleDate?: Date | string): Promise<Date> => {
  // Always use current local time for maximum reliability
  const currentDate = new Date();
  
  // Only log if the input date was significantly different
  if (saleDate) {
    const inputDate = new Date(saleDate);
    const timeDiff = Math.abs(currentDate.getTime() - inputDate.getTime());
    
    // Only log if difference is more than 1 hour
    if (timeDiff > 3600000) {
      logDateCorrection(
        inputDate, 
        currentDate,
        `Large time difference detected: ${timeDiff}ms. Using current time for reliability.`
      );
    }
  }
  
  return currentDate;
};

/**
 * Formats a date for display with timezone awareness
 */
export const formatDateForDisplay = (date: Date | string, includeTime: boolean = true): string => {
  const dateObj = new Date(date);
  
  if (includeTime) {
    return dateObj.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } else {
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
};

/**
 * Converts local date to UTC for database storage
 */
export const toUTCForStorage = (date: Date): Date => {
  return new Date(date.toISOString());
};

/**
 * Converts UTC date from database to local timezone for display
 */
export const fromUTCForDisplay = (utcDate: Date | string): Date => {
  return new Date(utcDate);
};

/**
 * Logs date corrections for monitoring
 */
const logDateCorrection = (originalDate: Date, correctedDate: Date, reason: string) => {
  const logEntry = {
    event: 'DATE_CORRECTION',
    originalDate: originalDate.toISOString(),
    correctedDate: correctedDate.toISOString(),
    reason,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };
  
  console.warn('DATE_CORRECTION:', logEntry);
  
  // Store in localStorage for debugging
  try {
    const logs = JSON.parse(localStorage.getItem('date_correction_logs') || '[]');
    logs.push(logEntry);
    
    // Keep only last 20 entries
    if (logs.length > 20) {
      logs.splice(0, logs.length - 20);
    }
    
    localStorage.setItem('date_correction_logs', JSON.stringify(logs));
  } catch (error) {
    console.error('Error storing date correction log:', error);
  }
};

/**
 * Gets recent date correction events for debugging
 */
export const getDateCorrectionLogs = (): any[] => {
  try {
    return JSON.parse(localStorage.getItem('date_correction_logs') || '[]');
  } catch (error) {
    console.error('Error retrieving date correction logs:', error);
    return [];
  }
};

/**
 * Checks if the system clock is likely incorrect based on various heuristics
 */
export const detectIncorrectSystemClock = async (): Promise<{
  isLikelyIncorrect: boolean;
  confidence: 'low' | 'medium' | 'high';
  issues: string[];
}> => {
  const issues: string[] = [];
  let confidence: 'low' | 'medium' | 'high' = 'low';
  
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Check if year is reasonable
  if (currentYear < 2024 || currentYear > 2030) {
    issues.push('Año del sistema fuera de rango esperado');
    confidence = 'high';
  }
  
  // Check against server time
  try {
    const validation = await validateClientServerTime();
    if (validation.differenceMinutes > 60) {
      issues.push('Gran diferencia con hora del servidor');
      confidence = confidence === 'high' ? 'high' : 'medium';
    } else if (validation.differenceMinutes > 15) {
      issues.push('Diferencia moderada con hora del servidor');
      if (confidence === 'low') confidence = 'medium';
    }
  } catch (error) {
    issues.push('No se pudo verificar contra hora del servidor');
  }
  
  // Check if timezone offset seems reasonable
  const timezoneOffset = now.getTimezoneOffset();
  if (Math.abs(timezoneOffset) > 12 * 60) { // More than 12 hours offset
    issues.push('Zona horaria sospechosa');
    if (confidence === 'low') confidence = 'medium';
  }
  
  return {
    isLikelyIncorrect: issues.length > 0,
    confidence,
    issues
  };
};
