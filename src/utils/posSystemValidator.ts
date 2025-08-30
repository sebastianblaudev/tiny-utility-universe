/**
 * POS System Performance and Functionality Validator
 * Tests critical functionality to ensure offline sales and performance
 */

import { performanceMonitor } from './performanceMonitor';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  performance: {
    productLoadTime?: number;
    paymentProcessTime?: number;
    searchResponseTime?: number;
    cacheHitRatio?: number;
  };
}

export class POSSystemValidator {
  
  /**
   * Validate offline sales functionality
   */
  static async validateOfflineSales(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      performance: {}
    };

    try {
      // Test IndexedDB availability
      if (!window.indexedDB) {
        result.errors.push('IndexedDB no está disponible');
        result.isValid = false;
      }

      // Test localStorage
      try {
        localStorage.setItem('test', 'value');
        localStorage.removeItem('test');
      } catch (e) {
        result.errors.push('localStorage no está disponible');
        result.isValid = false;
      }

      // Test offline cache
      try {
        const { enhancedCache } = await import('./offlineCache');
        await enhancedCache.init();
        
        const metrics = await enhancedCache.getCacheMetrics();
        result.performance.cacheHitRatio = metrics.hitRatio;
        
        if (metrics.totalProducts === 0) {
          result.warnings.push('No hay productos en cache offline');
        }
      } catch (e) {
        result.warnings.push('Error al acceder al cache offline');
      }

      // Test offline manager
      try {
        const { offlineManager } = await import('./offlineUtils');
        // Just testing if it's accessible
        result.performance.searchResponseTime = 0; // Will be updated by actual usage
      } catch (e) {
        result.errors.push('Offline manager no disponible');
        result.isValid = false;
      }

    } catch (error) {
      result.errors.push(`Error general: ${error}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate payment system functionality
   */
  static async validatePaymentSystem(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      performance: {}
    };

    try {
      // Test payment processing hook
      // Note: We can't actually test the hook here, but we can verify imports
      const { usePOSOffline } = await import('../hooks/usePOSOffline');
      
      // Test if Supabase is available
      try {
        const { supabase } = await import('../integrations/supabase/client');
        // Simple connectivity test
        await supabase.from('sales').select('count').limit(1);
      } catch (e) {
        result.warnings.push('Conexión a Supabase limitada - funcionará offline');
      }

      // Test cart utilities
      try {
        const { addItemToCart, calculateCartTotal } = await import('./cartUtils');
        
        // Simple validation test
        const testProduct = {
          id: 'test',
          name: 'Test Product',
          price: 100,
          stock: 10
        };
        
        const testCart = addItemToCart([], testProduct);
        
        const total = calculateCartTotal(testCart);
        if (total !== 100) {
          result.errors.push('Cálculo de carrito incorrecto');
          result.isValid = false;
        }
      } catch (e) {
        result.errors.push('Utilidades del carrito no disponibles');
        result.isValid = false;
      }

    } catch (error) {
      result.errors.push(`Error en sistema de pagos: ${error}`);
      result.isValid = false;
    }

    return result;
  }

  /**
   * Run comprehensive system validation
   */
  static async validateFullSystem(): Promise<ValidationResult> {
    const startTime = performance.now();
    
    const offlineResult = await this.validateOfflineSales();
    const paymentResult = await this.validatePaymentSystem();
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;

    const combinedResult: ValidationResult = {
      isValid: offlineResult.isValid && paymentResult.isValid,
      errors: [...offlineResult.errors, ...paymentResult.errors],
      warnings: [...offlineResult.warnings, ...paymentResult.warnings],
      performance: {
        ...offlineResult.performance,
        ...paymentResult.performance,
        productLoadTime: totalTime
      }
    };

    // Performance warnings
    if (totalTime > 2000) {
      combinedResult.warnings.push(`Validación lenta: ${totalTime.toFixed(0)}ms`);
    }

    // Log results
    console.log('🔍 POS System Validation Results:', {
      valid: combinedResult.isValid,
      errors: combinedResult.errors.length,
      warnings: combinedResult.warnings.length,
      duration: `${totalTime.toFixed(0)}ms`
    });

    if (combinedResult.errors.length > 0) {
      console.error('❌ Errores críticos:', combinedResult.errors);
    }

    if (combinedResult.warnings.length > 0) {
      console.warn('⚠️ Advertencias:', combinedResult.warnings);
    }

    return combinedResult;
  }

  /**
   * Quick health check for frequent monitoring
   */
  static async quickHealthCheck(): Promise<boolean> {
    try {
      // Test essential functionality
      const hasIndexedDB = !!window.indexedDB;
      const hasLocalStorage = !!window.localStorage;
      const hasPerformanceAPI = !!window.performance;

      const isHealthy = hasIndexedDB && hasLocalStorage && hasPerformanceAPI;
      
      if (!isHealthy) {
        console.warn('🏥 Health check failed:', {
          indexedDB: hasIndexedDB,
          localStorage: hasLocalStorage,
          performance: hasPerformanceAPI
        });
      }

      return isHealthy;
    } catch (error) {
      console.error('🚨 Health check error:', error);
      return false;
    }
  }
}

// Auto-run validation in development
if (process.env.NODE_ENV === 'development') {
  // Run validation after a brief delay to allow app initialization
  setTimeout(async () => {
    try {
      const result = await POSSystemValidator.validateFullSystem();
      
      if (result.isValid) {
        console.log('✅ POS System validation passed');
      } else {
        console.error('❌ POS System validation failed');
      }
    } catch (error) {
      console.error('🚨 Validation error:', error);
    }
  }, 3000);
}