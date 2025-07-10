import { Controller, Get } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';

interface WhatsAppStatusResponse {
  isHealthy: boolean;
  state: string | null;
  failureCount: number;
  hasQrCode: boolean;
  qrCode?: string;
  timestamp: number;
}

@Controller('whatsapp')
export class WhatsAppController {
  constructor(private readonly whatsAppService: WhatsAppService) {}

  /**
   * Get the current WhatsApp status
   * @returns The current WhatsApp status
   */
  @Get('status')
  getStatus(): WhatsAppStatusResponse {
    const status = this.whatsAppService.getStatus();
    const response: WhatsAppStatusResponse = {
      ...status,
      timestamp: Date.now(),
    };

    return response;
  }
}
