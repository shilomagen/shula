import { Injectable } from '@nestjs/common';
import { WhatsAppStatus, WhatsAppQrCode } from '@prisma/client';
import { WhatsAppQrCodeResponseDto } from './dto/whatsapp-qrcode-response.dto';
import { WhatsAppStatusResponseDto } from './dto/whatsapp-status-response.dto';

@Injectable()
export class WhatsAppStatusMapper {
  toStatusDto(status: WhatsAppStatus | null): WhatsAppStatusResponseDto {
    if (!status) {
      return {
        isHealthy: false,
        state: 'UNKNOWN',
        failureCount: 0,
        hasQrCode: false,
        updatedAt: new Date(),
      };
    }

    return {
      isHealthy: status.isHealthy,
      state: status.state,
      failureCount: status.failureCount,
      hasQrCode: false,
      updatedAt: status.updatedAt,
    };
  }

  toQrCodeDto(qrCode: WhatsAppQrCode | null): WhatsAppQrCodeResponseDto {
    if (!qrCode) {
      return {
        qrCode: null,
        updatedAt: null,
      };
    }

    return {
      qrCode: qrCode.qrCode,
      updatedAt: qrCode.updatedAt,
    };
  }
}
