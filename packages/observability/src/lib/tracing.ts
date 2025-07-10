import * as grpc from '@grpc/grpc-js';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  CompositePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

/**
 * Configures and initializes OpenTelemetry tracing for Node.js applications
 * @param options Configuration options
 * @returns NodeSDK instance
 */
export function initTracing(options?: {
  ignoreRoutes?: string[];
  serviceName?: string;
  serviceVersion?: string;
  traceEndpoint?: string;
  metricsEndpoint?: string;
}) {

  const ignoreRoutes = options?.ignoreRoutes || ['/health'];
  const serviceName = options?.serviceName || process.env.OTEL_SERVICE_NAME;
  const serviceVersion = options?.serviceVersion || '1.0.0';
  const traceEndpoint =
    options?.traceEndpoint ||
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
    '';
  const metricsEndpoint =
    options?.metricsEndpoint ||
    process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT ||
    '';

  const traceExporter = new OTLPTraceExporter({
    url: traceEndpoint,
    credentials: grpc.credentials.createInsecure(),
  });

  const metricExporter = new OTLPMetricExporter({
    url: metricsEndpoint,
    credentials: grpc.credentials.createInsecure(),
  });

  const propagator = new CompositePropagator({
    propagators: [
      new W3CTraceContextPropagator(),
      // Add other propagators if needed, e.g.:
      // new B3Propagator(),
    ],
  });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
    }),
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 1000,
    }),
    textMapPropagator: propagator,

    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': {
          ignoreIncomingRequestHook: (req) => {
            const url = req.url || '';
            return ignoreRoutes.some((route) => url.includes(route));
          },
        },
        '@opentelemetry/instrumentation-express': {
          ignoreLayers: [...ignoreRoutes],
        },
      }),
    ],
  });

  sdk.start();

  if (
    typeof global.process !== 'undefined' &&
    typeof global.process.on === 'function'
  ) {
    global.process.on('SIGTERM', () => {
      sdk
        .shutdown()
        .then(
          () => console.log('OpenTelemetry SDK shut down successfully'),
          (err) => console.log('Error shutting down OpenTelemetry SDK', err)
        )
        .finally(() => {
          if (typeof global.process.exit === 'function') {
            global.process.exit(0);
          }
        });
    });
  }

  return sdk;
}
