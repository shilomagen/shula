import { Injectable } from '@nestjs/common';
import { ContextLogger } from 'nestjs-context-logger';
import type { WebhookPayload } from './webhook.types';

@Injectable()
export class WebhookService {
  private readonly logger = new ContextLogger(WebhookService.name);

  /**
   * Log the webhook payload
   * @param payload The webhook payload to log
   */
  logWebhookPayload(payload: WebhookPayload): void {
    this.logger.log('Received webhook payload', payload);
  }
}
