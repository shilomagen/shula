import { runWithCtx } from 'nestjs-context-logger/dist/store/context-store';
import { v4 as uuidv4 } from 'uuid';
import {
  trace,
  context,
  SpanStatusCode,
  ROOT_CONTEXT,
} from '@opentelemetry/api';
import { WhatsAppEvent } from './whatsapp-event.enum';

/**
 * Decorator that wraps methods with OpenTelemetry execution context
 * to ensure tracing and context is available throughout the function execution.
 *
 * @param eventType - The type of WhatsApp event being handled
 *
 * @example
 * @WithExecutionContext(WhatsAppEvent.MESSAGE_RECEIVED)
 * async onMessageReceived(message) {
 *   // Execution context and tracing are now available
 *   // Rest of your method...
 * }
 */
export function WithExecutionContext(eventType: WhatsAppEvent) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Create context data based on event type
      const initialContext: Record<string, any> = {
        correlationId: uuidv4(),
        eventName: eventType,
        methodName: propertyKey,
      };

      // Extract relevant context data from event arguments
      const eventData = args[0]; // First argument is typically the event data

      // Extract WhatsApp-specific context properties if available
      if (eventData) {
        // Message events
        if (eventData.id) {
          initialContext.messageId = eventData.id?._serialized || eventData.id;
        }

        if (eventData.from) {
          initialContext.chatId = eventData.from;
        }

        if (eventData.participant) {
          initialContext.participantId = eventData.participant;
        }

        // Group events
        if (eventData.chatId) {
          initialContext.chatId = eventData.chatId;
        }

        if (eventData.groupId) {
          initialContext.groupId = eventData.groupId;
        }
      }

      // Setup tracing with OpenTelemetry
      const tracer = trace.getTracer('whatsapp-service');
      const operationName = `whatsapp.event.${eventType}`;

      // Convert initialContext to span attributes
      const attributes: Record<string, string> = {};
      Object.entries(initialContext).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          attributes[key] = String(value);
        }
      });

      // Add the event type as an attribute
      attributes['event.type'] = eventType;

      // Always start with a clean ROOT_CONTEXT to ensure isolation between events
      const ctx = ROOT_CONTEXT;

      // Create a new span with root: true to ensure it's a new trace
      const span = tracer.startSpan(operationName, {
        attributes,
        root: true,
      });

      try {
        // Create a new context with this span
        const spanContext = trace.setSpan(ctx, span);

        // Run with isolated context
        return await context.with(spanContext, async () => {
          // Execute within the nestjs context logger
          return await runWithCtx(async () => {
            // Execute the original method
            return await originalMethod.apply(this, args);
          }, initialContext);
        });
      } catch (error) {
        // Record exception and set error status on the span
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      } finally {
        // Always end the span
        span.end();
      }
    };

    return descriptor;
  };
}
