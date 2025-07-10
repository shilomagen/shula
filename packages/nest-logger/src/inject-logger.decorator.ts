import { Inject } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

/**
 * Decorator that injects a Logger with the context set to the class name
 *
 * @example
 * // Usage in a service
 * @Injectable()
 * class MyService {
 *   constructor(@InjectLogger() private readonly logger) {}
 * }
 */
export function InjectLogger() {
  return (
    target: any,
    key: string | symbol | undefined,
    parameterIndex: number
  ) => {
    const className = target.name || target.constructor.name;

    // Add a parameter decorator metadata that will be processed by NestJS DI system
    return Inject((pinoLogger: Logger) => {
      // Create a custom formatter that transforms logs to the desired format
      const logger = pinoLogger;

      // Wrap the logger methods to format logs as {msg, data}
      const wrappedLogger = {
        log: (message: any, payload?: any) => {
          logger.log({ msg: message, data: payload, context: className });
        },
        error: (message: any, trace?: string, payload?: any) => {
          logger.error({
            msg: message,
            data: payload,
            trace,
            context: className,
          });
        },
        warn: (message: any, payload?: any) => {
          logger.warn({ msg: message, data: payload, context: className });
        },
        debug: (message: any, payload?: any) => {
          logger.debug({ msg: message, data: payload, context: className });
        },
        verbose: (message: any, payload?: any) => {
          logger.verbose({ msg: message, data: payload, context: className });
        },
      };

      return wrappedLogger;
    })(target, key as string | symbol, parameterIndex);
  };
}
