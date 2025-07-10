import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WhatsAppQrCodeResponseDto } from './dto/whatsapp-qrcode-response.dto';
import { WhatsAppStatusResponseDto } from './dto/whatsapp-status-response.dto';
import { WhatsAppStatusService } from './whatsapp-status.service';

@ApiTags('WhatsApp Status')
@Controller('whatsapp-status')
export class WhatsAppStatusController {
  constructor(private readonly statusService: WhatsAppStatusService) {}

  @Get()
  @ApiOperation({
    summary: 'Get the current WhatsApp status',
    operationId: 'getStatus',
  })
  @ApiResponse({
    status: 200,
    description: 'The current WhatsApp status',
    type: WhatsAppStatusResponseDto,
  })
  async getStatus(): Promise<WhatsAppStatusResponseDto> {
    const status = await this.statusService.getStatus();

    // Check if QR code is available
    const qrCodeResponse = await this.statusService.getQrCode();

    // Create a new object with the updated hasQrCode property
    return {
      ...status,
      hasQrCode: !!qrCodeResponse.qrCode,
    };
  }

  @Get('qr-code')
  @ApiOperation({
    summary: 'Get the current WhatsApp QR code',
    operationId: 'getWhatsAppQrCode',
  })
  @ApiResponse({
    status: 200,
    description:
      'The current WhatsApp QR code (null if not available or expired)',
    type: WhatsAppQrCodeResponseDto,
  })
  async getQrCode(): Promise<WhatsAppQrCodeResponseDto> {
    return this.statusService.getQrCode();
  }
}
