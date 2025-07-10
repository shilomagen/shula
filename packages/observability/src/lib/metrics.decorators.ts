import { MetricsService } from './metrics.service';

/**
 * Decorator to track method execution metrics including:
 * - Call count
 * - Success count
 * - Error count
 * - Execution duration
 */
export function TrackMetrics(
  metricName?: string,
  labels: Record<string, string> = {}
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;
    const actualMetricName = metricName || `${className}_${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      // Get the metrics service from the Nest.js container
      const metricsService = this.moduleRef?.get(MetricsService, {
        strict: false,
      });

      if (!metricsService) {
        console.warn(
          `MetricsService not found, metrics for ${actualMetricName} will not be recorded`
        );
        return originalMethod.apply(this, args);
      }

      // Add method execution counter
      metricsService.incrementCounter(`${actualMetricName}_calls_total`, 1, {
        ...labels,
        class: className,
        method: propertyKey,
      });

      const startTime = Date.now();
      try {
        // Execute the original method
        const result = await originalMethod.apply(this, args);

        // Record success metric
        metricsService.incrementCounter(
          `${actualMetricName}_success_total`,
          1,
          {
            ...labels,
            class: className,
            method: propertyKey,
          }
        );

        return result;
      } catch (error) {
        // Record error metric
        metricsService.incrementCounter(`${actualMetricName}_error_total`, 1, {
          ...labels,
          class: className,
          method: propertyKey,
          error_type: error.name,
        });

        throw error;
      } finally {
        // Record duration metric
        const duration = Date.now() - startTime;
        metricsService.recordHistogram(
          `${actualMetricName}_duration_ms`,
          duration,
          {
            ...labels,
            class: className,
            method: propertyKey,
          }
        );
      }
    };

    return descriptor;
  };
}

/**
 * Track HTTP endpoint metrics
 */
export function TrackEndpoint(path?: string, method?: string) {
  return TrackMetrics('http_endpoint', {
    path: path || 'unknown',
    method: method || 'unknown',
  });
}

/**
 * Track database operation metrics
 */
export function TrackDbOperation(operation: string, entity: string) {
  return TrackMetrics('db_operation', { operation, entity });
}

/**
 * Track external API call metrics
 */
export function TrackApiCall(service: string, endpoint: string) {
  return TrackMetrics('external_api_call', { service, endpoint });
}
