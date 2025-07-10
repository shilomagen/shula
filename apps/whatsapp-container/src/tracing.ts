import { initTracing } from '@shula/observability';

// Initialize tracing with service name and version
initTracing({
  serviceName: process.env.OTEL_SERVICE_NAME,
  serviceVersion: '1.0.0',
});
