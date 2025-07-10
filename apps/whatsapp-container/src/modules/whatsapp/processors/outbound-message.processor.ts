import { Processor, WorkerHost } from '@smangam/bullmq';
import { ConfigService } from '@nestjs/config';
import {
  OutboundMessageJobData,
  QUEUE_NAMES,
  WithContext,
} from '@shula/shared-queues';
import axios from 'axios';
import { Job } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import { MessageMedia, Poll } from 'whatsapp-web.js';
import { WhatsAppService } from '../whatsapp.service';

/**
 * Processor for handling outbound message jobs
 */
@Processor(QUEUE_NAMES.OUTBOUND_MESSAGE, {
  limiter: { max: 1, duration: 500 },
  concurrency: 1,
})
export class OutboundMessageProcessor extends WorkerHost {
  private readonly logger = new ContextLogger(OutboundMessageProcessor.name);

  constructor(
    private readonly whatsAppService: WhatsAppService,
    private readonly configService: ConfigService
  ) {
    super();
  }

  /**
   * Process an outbound message job
   * @param job The job containing the message data
   */
  @WithContext()
  async process(job: Job<OutboundMessageJobData>): Promise<void> {
    const { phoneNumber, content, metadata } = job.data;
    this.logger.log(`Processing outbound message job: ${job.name}`, {
      phoneNumber,
      content,
      metadata,
    });
    try {
      // Process different types of jobs
      if (job.name === 'outbound-message') {
        await this.processTextOrMediaMessage(job);
      } else if (job.name === 'outbound-poll') {
        await this.processPollMessage(job);
      } else {
        this.logger.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to process outbound message: ${error.message}`,
          { error }
        );
      } else {
        this.logger.error('Failed to process outbound message: Unknown error');
      }
      throw error;
    }
  }

  /**
   * Process a text or media message job
   * @param job The job containing the message data
   */
  private async processTextOrMediaMessage(
    job: Job<OutboundMessageJobData>
  ): Promise<void> {
    try {
      const { phoneNumber, content, media, metadata } = job.data;

      // Check if this is a group message
      const isGroupMessage = metadata?.additionalData?.isGroupMessage === true;

      this.logger.log(
        `Processing outbound message for ${
          isGroupMessage ? 'group' : 'user'
        } ${phoneNumber} (type: ${metadata?.type || 'unknown'})`
      );

      // Prepare the chat ID based on whether it's a group message or not
      let chatId: string;

      if (isGroupMessage) {
        // For group messages, the phoneNumber field contains the WhatsApp group ID
        // Group IDs should already be in the correct format (e.g., 123456789@g.us)
        // If not in correct format, add the suffix
        chatId = phoneNumber.includes('@g.us')
          ? phoneNumber
          : `${phoneNumber}@g.us`;
      } else {
        // For individual messages, format the phone number as usual
        const sanitizedNumber = phoneNumber.replace(/\D/g, '');
        chatId = `${sanitizedNumber}@c.us`;

        // Check if the number is registered with WhatsApp (only for individual users)
        try {
          const isRegistered = await this.whatsAppService
            .getClient()
            .isRegisteredUser(chatId);

          if (!isRegistered) {
            this.logger.warn(
              `Phone number ${phoneNumber} is not registered with WhatsApp`
            );
            return;
          }
        } catch (error) {
          this.logger.error(
            `Error checking if user is registered: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
          return;
        }
      }

      // Prepare media if available
      let messageMedia: MessageMedia | undefined;
      if (media) {
        if (media.base64Data) {
          messageMedia = new MessageMedia(
            media.mimetype || 'image/jpeg',
            media.base64Data,
            media.filename || 'media'
          );
        } else if (media.mediaUrl) {
          // For media URLs, we need to download and convert to base64
          try {
            messageMedia = await MessageMedia.fromUrl(media.mediaUrl, {
              unsafeMime: true,
              filename: media.filename || 'media',
            });
          } catch (error) {
            this.logger.error(
              `Failed to download media from URL: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`
            );
          }
        }
      }

      // Send the message
      const sentMessage = await this.whatsAppService
        .getClient()
        .sendMessage(
          chatId,
          content,
          messageMedia ? { media: messageMedia } : undefined
        );

      this.logger.log(
        `Successfully sent message to ${
          isGroupMessage ? 'group' : 'user'
        } ${phoneNumber} (type: ${metadata?.type || 'unknown'})`
      );

      // Check if this is a consent message and we need to save the message ID
      if (
        isGroupMessage &&
        metadata?.additionalData?.isConsentMessage === true &&
        metadata?.additionalData?.saveMessageId === true
      ) {
        try {
          this.logger.log(
            `Saving consent message ID ${sentMessage.id._serialized} for group ${chatId}`
          );

          // Save the message ID in the database
          await this.saveConsentMessageId(chatId, sentMessage.id._serialized);

          this.logger.log(
            `Saved consent message ID ${sentMessage.id._serialized} for group ${chatId}`
          );
        } catch (error) {
          this.logger.error(
            `Failed to save consent message ID: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            { error }
          );
        }
      }

      // Log additional metadata for debugging
      if (metadata) {
        this.logger.debug(
          `Message metadata: type=${metadata.type}, sourceId=${metadata.sourceId}, groupId=${metadata.groupId}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to process text/media message: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    }
  }

  /**
   * Save the consent message ID for a group
   * @param whatsappGroupId The WhatsApp group ID
   * @param messageId The message ID to save
   */
  private async saveConsentMessageId(
    whatsappGroupId: string,
    messageId: string
  ): Promise<void> {
    try {
      const backendUrl = this.configService.getOrThrow('backend.url');
      // Call the backend API to update the group with the consent message ID
      await axios.post(`${backendUrl}/api/v1/groups/consent-message`, {
        whatsappGroupId,
        consentMessageId: messageId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to save consent message ID: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    }
  }

  /**
   * Process a poll message job
   * @param job The job containing the poll data
   */
  private async processPollMessage(
    job: Job<OutboundMessageJobData>
  ): Promise<void> {
    try {
      const { phoneNumber, content, poll, metadata } = job.data;

      if (!poll || !poll.options || poll.options.length === 0) {
        throw new Error('Poll data is missing or invalid');
      }

      this.logger.log(
        `Processing outbound poll for group ${phoneNumber} (type: ${
          metadata?.type || 'unknown'
        })`
      );

      // Polls are only supported for groups in WhatsApp
      // Format the chat ID for a group
      const chatId = phoneNumber.includes('@g.us')
        ? phoneNumber
        : `${phoneNumber}@g.us`;

      // Extract poll options
      const pollOptions = poll.options.map((option) => option.text);

      // Create a Poll object
      const pollObject = new Poll(content, pollOptions, {
        allowMultipleAnswers: !!poll.isMultipleChoice,
        messageSecret: undefined, // Let the library generate a random message secret
      });

      // Send the poll using the standard sendMessage method
      const message = await this.whatsAppService
        .getClient()
        .sendMessage(chatId, pollObject);

      this.logger.log(
        `Successfully sent poll to group ${phoneNumber} (type: ${
          metadata?.type || 'unknown'
        }), message ID: ${message.id._serialized}`
      );

      await this.whatsAppService.getClient().interface.openChatWindow(chatId);

      this.logger.log(`Opened chat window for group ${phoneNumber}`);

      // Log additional metadata for debugging
      if (metadata) {
        this.logger.debug(
          `Poll metadata: type=${metadata.type}, sourceId=${metadata.sourceId}, groupId=${metadata.groupId}`
        );
      }

      // Return the message ID so it can be stored for tracking responses
      return;
    } catch (error) {
      this.logger.error(
        `Failed to process poll message: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    }
  }
}
