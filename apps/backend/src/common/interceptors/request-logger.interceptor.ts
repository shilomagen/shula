import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Optional,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ContextLogger } from 'nestjs-context-logger';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { RequestLoggerConfig } from './request-logger.config';

interface RequestLogData {
  method: string;
  url: string;
  ip: string;
  statusCode?: number;
  contentLength?: string | number;
  userAgent?: string;
  duration: number;
  timestamp: string;
  requestBody?: unknown;
  responseBody?: unknown;
  params?: unknown;
  query?: unknown;
  headers?: Record<string, unknown>;
}

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private readonly logger = new ContextLogger(RequestLoggerInterceptor.name);
  private readonly defaultConfig: RequestLoggerConfig = {
    logRequestBody: false,
    logResponseBody: false,
    excludeHeaders: ['authorization', 'cookie', 'set-cookie'],
    maxBodyLength: 1000,
  };
  private readonly config: RequestLoggerConfig;

  constructor(@Optional() config?: RequestLoggerConfig) {
    this.config = { ...this.defaultConfig, ...config };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const requestStart = Date.now();
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, originalUrl, headers, params, query, body } = request;
    const ip = request.ip || '0.0.0.0';
    const userAgent = headers['user-agent'] || 'unknown';

    // Skip logging for health check endpoints
    if (originalUrl === '/health' || originalUrl === '/api/health') {
      return next.handle();
    }

    // Log incoming request
    this.logger.log(
      `Incoming request - ${method} ${originalUrl} from IP: ${ip}`
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - requestStart;
          const statusCode = response.statusCode;

          // Get content length with proper type handling
          const headerContentLength = response.getHeader('content-length');
          let contentLength: string | number | undefined;

          if (
            typeof headerContentLength === 'string' ||
            typeof headerContentLength === 'number'
          ) {
            contentLength = headerContentLength;
          } else if (
            Array.isArray(headerContentLength) &&
            headerContentLength.length > 0
          ) {
            contentLength = String(headerContentLength[0]);
          } else if (data) {
            contentLength = JSON.stringify(data).length;
          }

          const logData: RequestLogData = {
            method,
            url: originalUrl,
            ip,
            statusCode,
            contentLength,
            userAgent,
            duration: responseTime,
            timestamp: new Date().toISOString(),
            headers: this.sanitizeHeaders(headers),
            params,
            query,
          };

          // Include request body if configured
          if (this.config.logRequestBody && body) {
            logData.requestBody = this.truncateBody(body);
          }

          // Include response body if configured
          if (this.config.logResponseBody && data) {
            logData.responseBody = this.truncateBody(data);
          }

          // Log request completion with timing information
          this.logger.log(
            `Request completed - ${method} ${originalUrl} - Status: ${statusCode} - Duration: ${responseTime}ms`,
            logData
          );
        },
        error: (error) => {
          const responseTime = Date.now() - requestStart;

          const logData: RequestLogData = {
            method,
            url: originalUrl,
            ip,
            statusCode: error.status || 500,
            userAgent,
            duration: responseTime,
            timestamp: new Date().toISOString(),
            headers: this.sanitizeHeaders(headers),
            params,
            query,
          };

          // Include request body if configured
          if (this.config.logRequestBody && body) {
            logData.requestBody = this.truncateBody(body);
          }

          // Log error with timing information
          this.logger.error(
            `Request failed - ${method} ${originalUrl} - Error: ${error.message} - Duration: ${responseTime}ms`,
            { error, logData }
          );
        },
      })
    );
  }

  /**
   * Sanitize headers by removing sensitive information
   */
  private sanitizeHeaders(
    headers: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized = { ...headers };
    // Remove sensitive information
    const sensitiveHeaders = this.config.excludeHeaders || [];
    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    return sanitized;
  }

  /**
   * Truncate body content to prevent excessive logging
   */
  private truncateBody(body: unknown): unknown {
    const stringified = JSON.stringify(body);
    if (stringified.length <= (this.config.maxBodyLength || 1000)) {
      return body;
    }
    return `${stringified.substring(
      0,
      this.config.maxBodyLength || 1000
    )}... [truncated]`;
  }
}
