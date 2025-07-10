import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ContextLogger } from 'nestjs-context-logger';
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new ContextLogger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: unknown =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // If it's a BadRequestException, ensure the message is an array
    if (exception instanceof BadRequestException) {
      const exceptionResponse = exception.getResponse();

      // Ensure message is an array
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        if (Object.prototype.hasOwnProperty.call(responseObj, 'message')) {
          message = Array.isArray(responseObj.message)
            ? responseObj.message
            : [responseObj.message || 'Bad request'];
        } else {
          message = ['Bad request'];
        }
      } else {
        message = [String(exceptionResponse) || 'Bad request'];
      }
    }

    // Full error details for logging
    const fullErrorDetails = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
      exception:
        exception instanceof Error
          ? {
              name: exception.name,
              message: exception.message,
              stack: exception.stack,
            }
          : exception,
      body: request.body,
      params: request.params,
      query: request.query,
      headers: this.sanitizeHeaders(request.headers),
    };

    this.logger.error(
      `${request.method} ${request.url} ${status}`,
      fullErrorDetails
    );

    // Simplified response for the client
    const clientResponse = {
      statusCode: status,
      message: this.simplifyErrorMessage(message),
    };

    response.status(status).json(clientResponse);
  }

  private sanitizeHeaders(
    headers: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized = { ...headers };
    // Remove sensitive information
    const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie'];
    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    return sanitized;
  }

  private simplifyErrorMessage(message: unknown): string | string[] {
    if (Array.isArray(message)) {
      return message;
    }

    if (typeof message === 'object' && message !== null) {
      const msgObj = message as Record<string, unknown>;
      if (msgObj.message) {
        return Array.isArray(msgObj.message)
          ? msgObj.message
          : [String(msgObj.message)];
      }
    }

    return [String(message)];
  }
}
