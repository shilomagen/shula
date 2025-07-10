import { Injectable } from '@nestjs/common';
import { ContextLogger } from 'nestjs-context-logger';
import { PrismaService } from '../../database/prisma.service';
import { WhatsAppQrCodeResponseDto } from './dto/whatsapp-qrcode-response.dto';
import { WhatsAppStatusResponseDto } from './dto/whatsapp-status-response.dto';
import {
  WhatsAppQrCodeData,
  WhatsAppStatusData,
} from './queues/whatsapp-status.types';
import { WhatsAppStatusMapper } from './whatsapp-status.mapper';

@Injectable()
export class WhatsAppStatusService {
  private readonly logger = new ContextLogger(WhatsAppStatusService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: WhatsAppStatusMapper
  ) {}

  async getStatus(): Promise<WhatsAppStatusResponseDto> {
    try {
      const status = await this.prisma.whatsAppStatus.findUnique({
        where: { id: 'current' },
      });

      return this.mapper.toStatusDto(status);
    } catch (error) {
      this.logger.error(
        `Error retrieving WhatsApp status: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );

      return this.mapper.toStatusDto(null);
    }
  }

  async getQrCode(): Promise<WhatsAppQrCodeResponseDto> {
    try {
      const qrCode = await this.prisma.whatsAppQrCode.findUnique({
        where: { id: 'current' },
      });

      return this.mapper.toQrCodeDto(qrCode);
    } catch (error) {
      this.logger.error(
        `Error retrieving WhatsApp QR code: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );

      return this.mapper.toQrCodeDto(null);
    }
  }

  async updateStatus(data: WhatsAppStatusData): Promise<void> {
    try {
      await this.prisma.whatsAppStatus.upsert({
        where: { id: 'current' },
        update: {
          isHealthy: data.isHealthy,
          state: data.state,
          failureCount: data.failureCount,
        },
        create: {
          id: 'current',
          isHealthy: data.isHealthy,
          state: data.state,
          failureCount: data.failureCount,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error updating WhatsApp status: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw error;
    }
  }

  async updateQrCode(data: WhatsAppQrCodeData): Promise<void> {
    try {
      this.logger.log('Updating WhatsApp QR code');

      await this.prisma.whatsAppQrCode.upsert({
        where: { id: 'current' },
        update: {
          qrCode: data.qrCode,
        },
        create: {
          id: 'current',
          qrCode: data.qrCode,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error updating WhatsApp QR code: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw error;
    }
  }

  async clearQrCode(): Promise<void> {
    try {
      const qrCode = await this.prisma.whatsAppQrCode.findUnique({
        where: { id: 'current' },
      });

      if (!qrCode) {
        return;
      }

      await this.prisma.whatsAppQrCode.delete({
        where: { id: 'current' },
      });
    } catch (error) {
      this.logger.error(
        `Error clearing WhatsApp QR code: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
