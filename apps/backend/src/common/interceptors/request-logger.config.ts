/**
 * Configuration options for the RequestLoggerInterceptor
 */
export interface RequestLoggerConfig {
  /**
   * Whether to log the request body
   * @default false
   */
  readonly logRequestBody?: boolean;

  /**
   * Whether to log the response body
   * @default false
   */
  readonly logResponseBody?: boolean;

  /**
   * Headers to exclude from logging for privacy concerns
   * @default ['authorization', 'cookie', 'set-cookie']
   */
  readonly excludeHeaders?: string[];

  /**
   * Maximum length of logged body content
   * @default 1000
   */
  readonly maxBodyLength?: number;
}
