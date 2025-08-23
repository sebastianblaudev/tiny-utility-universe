/**
 * Performance monitoring utilities for POS system
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private enabled: boolean = true;

  // Start timing an operation
  startTiming(name: string, metadata?: Record<string, any>) {
    if (!this.enabled) return;
    
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
  }

  // End timing an operation
  endTiming(name: string): number | null {
    if (!this.enabled) return null;
    
    const metric = this.metrics.get(name);
    if (!metric) return null;

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    this.metrics.set(name, {
      ...metric,
      endTime,
      duration
    });

    // Log slow operations
    if (duration > 1000) {
      console.warn(`⚠️ Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    } else if (duration > 100) {
      console.log(`⏱️ ${name} completed in ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Get metrics for analysis
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Enable/disable monitoring
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Get performance summary
  getSummary() {
    const completedMetrics = this.getMetrics();
    if (completedMetrics.length === 0) return null;

    const durations = completedMetrics.map(m => m.duration!);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    return {
      totalOperations: completedMetrics.length,
      averageDuration: Math.round(avgDuration),
      maxDuration: Math.round(maxDuration),
      minDuration: Math.round(minDuration),
      slowOperations: completedMetrics.filter(m => m.duration! > 1000).length
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common operations
export const timeOperation = async <T>(
  name: string, 
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> => {
  performanceMonitor.startTiming(name, metadata);
  try {
    const result = await operation();
    return result;
  } finally {
    performanceMonitor.endTiming(name);
  }
};

export const timeSync = <T>(
  name: string,
  operation: () => T,
  metadata?: Record<string, any>
): T => {
  performanceMonitor.startTiming(name, metadata);
  try {
    const result = operation();
    return result;
  } finally {
    performanceMonitor.endTiming(name);
  }
};

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  return {
    startTiming: performanceMonitor.startTiming.bind(performanceMonitor),
    endTiming: performanceMonitor.endTiming.bind(performanceMonitor),
    timeOperation,
    timeSync,
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    getSummary: performanceMonitor.getSummary.bind(performanceMonitor),
    clearMetrics: performanceMonitor.clearMetrics.bind(performanceMonitor)
  };
};