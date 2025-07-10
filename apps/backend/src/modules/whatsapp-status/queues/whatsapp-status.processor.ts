import { Processor, WorkerHost } from '@smangam/bullmq';
import {
  PROCESSOR_NAMES,
  QUEUE_NAMES,
  WhatsAppQrCodeEvent,
  WhatsAppStatusEvent,
  WithContext,
} from '@shula/shared-queues';
import { Job } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import { WhatsAppStatusService } from '../whatsapp-status.service';

/**
 * Processor for WhatsApp status events
 */
@Processor(QUEUE_NAMES.WHATSAPP_STATUS, { concurrency: 50 })
export class WhatsAppStatusProcessor extends WorkerHost {
  private readonly logger = new ContextLogger(WhatsAppStatusProcessor.name);

  constructor(private readonly statusService: WhatsAppStatusService) {
    super();
  }

  /**
   * Process a job from the WhatsApp status queue
   * @param job The job to process
   */
  @WithContext()
  async process(
    job: Job<WhatsAppStatusEvent | WhatsAppQrCodeEvent>
  ): Promise<any> {
    try {
      switch (job.name) {
        case PROCESSOR_NAMES.WHATSAPP_STATUS.STATUS_UPDATE:
          return await this.processStatusUpdate(
            job.data as WhatsAppStatusEvent
          );
        case PROCESSOR_NAMES.WHATSAPP_STATUS.QR_CODE:
          return await this.processQrCode(job.data as WhatsAppQrCodeEvent);
        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
          return { success: false, error: 'Unknown job name' };
      }
    } catch (error) {
      this.logger.error(
        `Error processing WhatsApp status job: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw error;
    }
  }

  /**
   * Process a status update job
   * @param data The status update data
   */
  private async processStatusUpdate(
    data: WhatsAppStatusEvent
  ): Promise<{ success: boolean }> {
    try {
      // Update the status using the service
      await this.statusService.updateStatus({
        isHealthy: data.isHealthy,
        state: data.state,
        failureCount: data.failureCount,
        timestamp: data.timestamp,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error processing status update: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      return { success: false };
    }
  }

  /**
   * Process a QR code job
   * @param data The QR code data
   */
  private async processQrCode(
    data: WhatsAppQrCodeEvent
  ): Promise<{ success: boolean }> {
    try {
      this.logger.log(
        `WhatsApp QR Code Received at ${new Date(data.timestamp).toISOString()}`
      );

      // Update the QR code using the service
      await this.statusService.updateQrCode({
        qrCode: data.qrCode,
        timestamp: data.timestamp,
      });

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error processing QR code: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      return { success: false };
    }
  }
}
