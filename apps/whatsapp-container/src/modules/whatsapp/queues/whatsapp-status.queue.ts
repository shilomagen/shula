import { InjectQueue } from '@smangam/bullmq';
import { Injectable } from '@nestjs/common';
import {
  QUEUE_NAMES,
  WhatsAppQrCodeEvent,
  WhatsAppStatusEvent,
  WhatsAppStatusEventType,
} from '@shula/shared-queues';
import { Queue } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for handling WhatsApp status events queue operations
 */
@Injectable()
export class WhatsAppStatusQueueService {
  private readonly logger = new ContextLogger(WhatsAppStatusQueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.WHATSAPP_STATUS)
    private readonly whatsappStatusQueue: Queue<
      WhatsAppStatusEvent | WhatsAppQrCodeEvent
    >
  ) {}

  /**
   * Add a status update job to the queue
   * @param status - The status update data
   * @returns Promise<void>
   */
  async addStatusUpdateJob(
    status: Omit<WhatsAppStatusEvent, 'eventType' | 'correlationId'>
  ): Promise<void> {
    try {
      const event: WhatsAppStatusEvent = {
        eventType: WhatsAppStatusEventType.STATUS_UPDATE,
        ...status,
        correlationId: uuidv4(),
      };

      this.logger.log('Adding WhatsApp status update job to queue', {
        status: event.state,
        correlationId: event.correlationId,
      });

      await this.whatsappStatusQueue.add(
        WhatsAppStatusEventType.STATUS_UPDATE,
        event,
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        }
      );

      this.logger.log('Successfully added WhatsApp status update job to queue');
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to add status update job: ${error.message}`,
          error
        );
      } else {
        this.logger.error('Failed to add status update job: Unknown error');
      }
      throw error;
    }
  }

  /**
   * Add a QR code job to the queue
   * @param qrCodeData - The QR code data
   * @returns Promise<void>
   */
  async addQrCodeJob(
    qrCodeData: Omit<WhatsAppQrCodeEvent, 'eventType' | 'correlationId'>
  ): Promise<void> {
    try {
      const event: WhatsAppQrCodeEvent = {
        eventType: WhatsAppStatusEventType.QR_CODE_UPDATED,
        ...qrCodeData,
        correlationId: uuidv4(),
      };

      this.logger.log('Adding WhatsApp QR code job to queue', {
        correlationId: event.correlationId,
      });

      await this.whatsappStatusQueue.add(
        WhatsAppStatusEventType.QR_CODE_UPDATED,
        event,
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        }
      );

      this.logger.log('Successfully added WhatsApp QR code job to queue');
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to add QR code job: ${error.message}`, error);
      } else {
        this.logger.error('Failed to add QR code job: Unknown error');
      }
      throw error;
    }
  }
}
