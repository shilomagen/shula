import * as Sentry from '@sentry/nestjs';
import { initTracing } from '@shula/observability';

  Sentry.init({
    dsn: 'https://57d8f146672324e5d0acecf7d22f1bff@o4507669768568832.ingest.us.sentry.io/4508954170818565',
    skipOpenTelemetrySetup: true,
    tracesSampleRate: 1.0,
  });

initTracing({
  serviceName: process.env.OTEL_SERVICE_NAME,
  serviceVersion: '1.0',
});
