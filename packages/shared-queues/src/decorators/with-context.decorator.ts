import { runWithCtx } from 'nestjs-context-logger/dist/store/context-store';
import { ContextLogger } from 'nestjs-context-logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Decorator that wraps methods with proper context handling
 * to ensure context is available throughout the function execution.
 *
 * Useful for functions like BullMQ processors where HTTP middleware context isn't available.
 *
 * @example
 * @WithContext
 * async process(job: Job) {
 *   // Context is now available through ContextLogger.getContext()
 *   const context = ContextLogger.getContext();
 *   // Rest of your method...
 * }
 */
export function WithContext() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // For BullMQ jobs, assuming the job is the first parameter
      const job = args[0];

      // Extract context properties from job data if available
      const initialContext: Record<string, any> = {};

      // Set correlationId or generate a new one
      if (job?.data?.correlationId) {
        initialContext.correlationId = job.data.correlationId;
      } else {
        initialContext.correlationId = uuidv4();
      }

      // Add additional context properties if present
      if (job?.data?.chatId) {
        initialContext.chatId = job.data.chatId;
      }

      if (job?.data?.messageId) {
        initialContext.messageId = job.data.messageId;
      }

      if (job?.id) {
        initialContext.jobId = job.id;
      }

      if (job?.name) {
        initialContext.jobType = job.name;
      }

      return runWithCtx(async () => {
        ContextLogger.updateContext(initialContext);

        // Execute the original method
        return await originalMethod.apply(this, args);
      }, initialContext);
    };

    return descriptor;
  };
}
