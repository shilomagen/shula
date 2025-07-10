import { Body, Controller, Post } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import type { WebhookPayload, WebhookResponse } from './webhook.types';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  /**
   * Handle incoming webhook requests
   * @param payload The webhook payload
   * @returns Confirmation of receipt
   */
  @Post()
  handleWebhook(@Body() payload: WebhookPayload): WebhookResponse {
    this.webhookService.logWebhookPayload(payload);
    return { success: true };
  }
}
