import { Injectable } from '@nestjs/common';
import { MetricsService } from '@shula/observability';
import {
  ImageMessageMedia,
  MessageMediaType,
  OutboundMessageJobData,
  QUEUE_NAMES
} from '@shula/shared-queues';
import { InjectQueue } from '@smangam/bullmq';
import { Queue } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import { v4 as uuid } from 'uuid';
import { formatPhoneNumber } from '../../../common/utils';

/**
 * Service for handling outbound message operations
 */
@Injectable()
export class OutboundMessageService {
  private readonly logger = new ContextLogger(OutboundMessageService.name);
  private readonly JOB_NAME = 'outbound-message';

  constructor(
    @InjectQueue(QUEUE_NAMES.OUTBOUND_MESSAGE)
    private readonly outboundMessageQueue: Queue<OutboundMessageJobData>,
    private readonly metricsService: MetricsService
  ) {}

  /**
   * Send a message to a phone number
   * @param phoneNumber - The phone number to send the message to
   * @param content - The message content
   * @param media - Optional media to attach to the message
   * @param metadata - Optional metadata for tracking and analytics
   * @returns Promise<void>
   */
  async sendMessage(
    phoneNumber: string,
    content: string,
    media?: ImageMessageMedia,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Format the phone number to ensure consistency
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      // Track outbound message attempt
      this.metricsService.incrementCounter('outbound_messages_total', 1, {
        messageType: 'individual',
        hasMedia: media ? 'true' : 'false',
      });

      // Also track individual messages specifically
      this.metricsService.incrementCounter(
        'outbound_individual_messages_total',
        1,
        {
          hasMedia: media ? 'true' : 'false',
        }
      );

      // Track media messages if applicable
      if (media) {
        this.metricsService.incrementCounter(
          'outbound_media_messages_total',
          1,
          {
            messageType: 'individual',
            mediaType: media.mediaType,
          }
        );
      }

      this.logger.log(`Sending message to ${formattedPhoneNumber}`, {
        contentLength: content.length,
        hasMedia: !!media,
      });

      // Prepare media data if available
      let mediaData: OutboundMessageJobData['media'] | undefined;
      if (media && media.mediaType === MessageMediaType.IMAGE) {
        mediaData = {
          base64Data: media.base64Data,
          mediaUrl: media.mediaUrl,
          mimetype: media.mimetype,
          filename: media.filename || 'image.jpg',
          mediaType: media.mediaType,
        };
      }

      // Create metadata with required fields
      const jobMetadata = {
        type: metadata?.type || 'MESSAGE',
        sourceId: metadata?.sourceId,
        groupId: metadata?.groupId,
        additionalData: metadata?.additionalData,
        timestamp: new Date(),
      };

      const correlationId = ContextLogger.getContext()?.correlationId || uuid();
      // Create job data
      const jobData: OutboundMessageJobData = {
        phoneNumber: formattedPhoneNumber,
        content,
        media: mediaData,
        metadata: jobMetadata,
        correlationId,
      };

      // Add job to queue
      await this.outboundMessageQueue.add(this.JOB_NAME, jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: 1000, // Keep failed jobs for debugging but limit to 1000
      });

      this.logger.log(
        `Successfully queued message for ${formattedPhoneNumber}`,
        {
          type: jobMetadata.type,
          sourceId: jobMetadata.sourceId,
        }
      );
    } catch (error) {
      // Track queue error
      this.metricsService.incrementCounter(
        'outbound_message_queue_error_total',
        1,
        {
          messageType: 'individual',
          errorType: error instanceof Error ? error.name : 'unknown',
        }
      );

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to queue message: ${errorMessage}`, { error });
      throw error;
    }
  }

  /**
   * Send a message to a WhatsApp group
   * @param groupId - The WhatsApp group ID
   * @param content - The message content
   * @param media - Optional media to attach to the message
   * @param metadata - Optional metadata for tracking and analytics
   * @returns Promise<void>
   */
  async sendGroupMessage(
    groupId: string,
    content: string,
    media?: ImageMessageMedia,
    metadata?: Record<string, any>,
    delay?: number
  ): Promise<void> {
    try {
      // Track group message
      this.metricsService.incrementCounter('outbound_messages_total', 1, {
        messageType: 'group',
        hasMedia: media ? 'true' : 'false',
        groupId,
      });

      this.logger.log(`Sending message to group ${groupId}`, {
        contentLength: content.length,
        hasMedia: !!media,
      });

      // Prepare media data if available
      let mediaData: OutboundMessageJobData['media'] | undefined;
      if (media && media.mediaType === MessageMediaType.IMAGE) {
        mediaData = {
          base64Data: media.base64Data,
          mediaUrl: media.mediaUrl,
          mimetype: media.mimetype,
          filename: media.filename || 'image.jpg',
          mediaType: media.mediaType,
        };
      }

      // Create metadata with required fields
      const jobMetadata = {
        type: metadata?.type || 'GROUP_MESSAGE',
        sourceId: metadata?.sourceId,
        groupId,
        additionalData: {
          ...metadata?.additionalData,
          isGroupMessage: true,
        },
        timestamp: new Date(),
      };

      // Create job data - use the group ID directly, the processor will handle it correctly
      const jobData: OutboundMessageJobData = {
        phoneNumber: groupId, // For groups, we use the group ID here
        content,
        media: mediaData,
        metadata: jobMetadata,
        correlationId: uuid(),
      };

      // Add job to queue
      await this.outboundMessageQueue.add(this.JOB_NAME, jobData, {
        attempts: 3,
        delay: delay || 0,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: 1000, // Keep failed jobs for debugging but limit to 1000
      });

      // Track job added to queue
      this.metricsService.incrementCounter(
        'outbound_message_queue_add_total',
        1,
        {
          jobType: this.JOB_NAME,
          messageType: 'group',
        }
      );

      this.logger.log(`Successfully queued message for group ${groupId}`, {
        type: jobMetadata.type,
      });
    } catch (error) {
      // Track queue error
      this.metricsService.incrementCounter(
        'outbound_message_queue_error_total',
        1,
        {
          messageType: 'group',
          errorType: error instanceof Error ? error.name : 'unknown',
        }
      );

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to queue group message: ${errorMessage}`, {
        error,
      });
      throw error;
    }
  }
}
