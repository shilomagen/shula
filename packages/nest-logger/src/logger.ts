import * as winston from 'winston';

const isProduction = process.env['NODE_ENV'] === 'production';

export interface LoggerParams {
  coralogixApiKey: string;
  host: string;
  serviceName: string;
}

const createCoralogixTransport = ({ coralogixApiKey, host, serviceName }: LoggerParams) =>
  isProduction
    ? [
        new winston.transports.Http({
          level: 'info',
          format: winston.format((info) => {
            const { level, message, ...payload } = info;
            return {
              level,
              message,
              applicationName: 'production',
              subsystemName: serviceName,
              computerName: host,
              timestamp: Date.now(),
              severity:
                {
                  silly: 1,
                  debug: 1,
                  verbose: 2,
                  info: 3,
                  warn: 4,
                  error: 5,
                  critical: 6,
                }[level] || 3,
              text: {
                message,
                ...payload,
              },
              payload,
            };
          })(),
          host: 'ingress.cx498.coralogix.com',
          path: 'logs/v1/singles',
          headers: {
            authorization: `Bearer ${coralogixApiKey}`,
          },
          ssl: true,
          batchInterval: 1000,
          handleExceptions: true,
        }),
      ]
    : [];

export const loggerOptions = (params: LoggerParams) => {
  return {
    transports: [
      new winston.transports.Console({
        level: isProduction ? 'info' : 'debug',
        format: isProduction
          ? winston.format.combine(
              winston.format.json(),
              winston.format.errors({ stack: true })
            )
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.timestamp(),
              winston.format.printf(
                ({ level, message, timestamp, context }) => {
                  const payload =
                    typeof context === 'object'
                      ? JSON.stringify(context)
                      : context;
                  return `${timestamp as string} ${level}: ${
                    message as string
                  } ${JSON.stringify(payload)}`;
                }
              )
            ),
      }),
      ...createCoralogixTransport(params),
    ],
  };
};
