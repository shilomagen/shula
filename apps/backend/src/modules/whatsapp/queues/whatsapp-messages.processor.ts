import { InjectQueue, Processor, WorkerHost } from '@smangam/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ImageMessageMedia,
  MessageEventType,
  MessageMediaType,
  MessageReceivedEvent,
  MessageStatusChangedEvent,
  QUEUE_NAMES,
  WithContext,
} from '@shula/shared-queues';
import { Job, Queue } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import { v4 as uuidv4 } from 'uuid';
import { EntityStatus, MessageType } from '../../../common/enums/domain.enums';
import {
  DelayedResponseJobData,
  ProcessorName,
  QueueName,
} from '../../../common/queue/queue.constants';
import { S3Service } from '../../../common/services/s3/s3.service';
import { formatPhoneNumber } from '../../../common/utils';
import { ConversationsService } from '../../conversations/conversations.service';
import { FaceRecognitionQueueService } from '../../face-recognition/queues/services/face-recognition-queue.service';
import { GroupMetricsService } from '../../group-metrics/group-metrics.service';
import { GroupsService } from '../../groups/groups.service';
import { ParticipantsService } from '../../participants/participants.service';

/**
 * Processor for WhatsApp message events
 */
@Injectable()
@Processor(QUEUE_NAMES.MESSAGE_PROCESSING)
export class WhatsAppMessagesProcessor extends WorkerHost {
  private readonly logger = new ContextLogger(WhatsAppMessagesProcessor.name);

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly participantsService: ParticipantsService,
    private readonly groupsService: GroupsService,
    private readonly faceRecognitionQueueService: FaceRecognitionQueueService,
    private readonly groupMetricsService: GroupMetricsService,
    private readonly s3Service: S3Service,
    @InjectQueue(QueueName.DELAYED_RESPONSE)
    private readonly delayedResponseQueue: Queue<DelayedResponseJobData>
  ) {
    super();
  }

  /**
   * Process a message event job
   * @param job - The job containing the message event
   */
  @WithContext()
  async process(
    job: Job<MessageReceivedEvent | MessageStatusChangedEvent>
  ): Promise<unknown> {
    try {
      this.logger.log(`Processing job ${job.id} of type ${job.name}`);

      // Determine the type of event and process accordingly
      const event = job.data;
      switch (job.name) {
        case MessageEventType.MESSAGE_RECEIVED:
          return this.processMessageReceived(event as MessageReceivedEvent);
        case MessageEventType.MESSAGE_STATUS_CHANGED:
          return this.processMessageStatusChanged(
            event as MessageStatusChangedEvent
          );
        default:
          this.logger.warn(`Unknown job type: ${job.name}`);
          return { success: false, error: 'Unknown job type' };
      }
    } catch (error) {
      this.handleError(job, error);
      throw error;
    }
  }

  /**
   * Process a message received event
   * @param event - The message received event
   */
  private async processMessageReceived(
    event: MessageReceivedEvent
  ): Promise<unknown> {
    this.logger.log(`Processing message received: ${event.messageId}`);
    this.updateParticipantInfo(event).catch((error) => {
      this.logger.error(
        `Error updating participant info: ${error.message}`,
        error.stack
      );
    });

    if (event.isGroupChat) {
      return this.handleGroupChatMessage(event);
    } else {
      return this.handlePrivateChatMessage(event);
    }
  }

  /**
   * Update the participant info
   * @param event - The message received event
   */
  private async updateParticipantInfo(
    event: MessageReceivedEvent
  ): Promise<void> {
    const formattedPhoneNumber = formatPhoneNumber(event.phoneNumber);
    const participant = await this.participantsService.findByPhoneNumber(
      formattedPhoneNumber
    );
    if (participant) {
      await this.participantsService.update(participant.id, {
        name: event.participantName || 'Unknown',
      });
    } else {
      this.logger.warn(
        `Participant with phone number ${formattedPhoneNumber} not found, skipping update`
      );
    }
  }
  /**
   * Handle a message from a group chat
   * @param event - The message received event
   */
  private async handleGroupChatMessage(
    event: MessageReceivedEvent
  ): Promise<unknown> {
    try {
      this.logger.log(
        `Processing group chat message: ${event.messageId} from ${event.participantName}`
      );

      // Find or create the group
      let group;
      try {
        group = await this.groupsService.findByWhatsAppId(event.chatId);
      } catch (error) {
        // If the group doesn't exist, log and rethrow
        if (error instanceof NotFoundException) {
          this.logger.warn(
            `Group ${event.chatId} not found in our system, skipping message processing`
          );
          return { success: true, action: 'skipped_inactive_group' };
        }
        this.logger.error(
          `Error finding group ${event.chatId}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        throw error;
      }

      // Check if the group is active
      if (group.status !== EntityStatus.ACTIVE) {
        this.logger.warn(
          `Group ${event.chatId} is not active (status: ${group.status}), skipping message processing`
        );
        return { success: true, action: 'skipped_inactive_group' };
      }

      // Log message processing event with metadata
      await this.groupMetricsService.logMessageProcessed(group.id, {
        messageId: event.messageId,
        participantName: event.participantName,
        timestamp: new Date().toISOString(),
        whatsappGroupId: event.chatId,
        hasContent: !!event.content,
        contentLength: event.content?.length || 0,
      });

      // For group chats, we're interested in media messages for face recognition
      if (event.media) {
        // Track specific media type
        const mediaType = event.media.mediaType;

        this.logger.log(
          `Group chat media received: ${event.messageId}, type: ${mediaType}, from ${event.participantName} in ${event.chatId}`
        );

        // Log media processing event with detailed metadata
        await this.groupMetricsService.logMediaProcessed(group.id, mediaType, {
          messageId: event.messageId,
          participantName: event.participantName,
          timestamp: new Date().toISOString(),
          whatsappGroupId: event.chatId,
          hasCaption: !!event.content,
          captionLength: event.content?.length || 0,
          mediaType: mediaType.toString(),
        });

        // Handle image media specifically for face recognition
        if (mediaType === MessageMediaType.IMAGE) {
          // Get the image media
          const imageMedia = event.media as ImageMessageMedia;

          // Check if we have image data
          if (!imageMedia.base64Data && !imageMedia.mediaUrl) {
            this.logger.warn(
              `Image message ${event.messageId} has no media data, skipping face recognition`
            );
            return { success: true, action: 'skipped_no_media_data' };
          }

          // Add the face recognition job to the queue using the new method
          await this.faceRecognitionQueueService.queueFaceRecognitionWithImageMedia(
            event.messageId,
            group.id,
            event.chatId,
            imageMedia,
            event.phoneNumber
          );

          return {
            success: true,
            action: 'queued_face_recognition',
            groupId: group.id,
            metrics: {
              mediaProcessed: true,
              mediaType: mediaType,
            },
          };
        } else {
          // For other media types, just log them
          return {
            success: true,
            action: 'logged_non_image_media',
            groupId: group.id,
            metrics: {
              mediaProcessed: true,
              mediaType: mediaType,
            },
          };
        }
      }

      // Process non-media messages from group chats
      this.logger.log(
        `Processing non-media message from group chat: ${event.messageId}`
      );
      return {
        success: true,
        action: 'processed_text_message',
        groupId: group.id,
        metrics: {
          messageProcessed: true,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error processing group chat message: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle a message from a private chat
   * @param event - The message received event
   */
  private async handlePrivateChatMessage(
    event: MessageReceivedEvent
  ): Promise<unknown> {
    try {
      // Format the phone number
      const formattedPhoneNumber = formatPhoneNumber(event.phoneNumber);

      // Find or create the participant
      const participant = await this.findOrCreateParticipant(
        formattedPhoneNumber,
        event.participantName
      );

      // Handle media if present
      if (event.media) {
        return this.handlePrivateMediaMessage(event, participant.id);
      }

      // Process the message through conversations service
      await this.conversationsService.processIncomingMessage(
        participant.id,
        event.content
      );

      return {
        success: true,
        participantId: participant.id,
        action: 'processed_private_message',
      };
    } catch (error) {
      this.logger.error(
        `Error processing private chat message: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle media message from private chat
   * @param event - The message received event
   * @param participantId - The participant ID
   */
  private async handlePrivateMediaMessage(
    event: MessageReceivedEvent,
    participantId: string
  ): Promise<unknown> {
    try {
      if (!event.media) {
        throw new Error('No media data in event');
      }

      // Add the media message to the conversation
      const { conversationId, lastMessageId } =
        await this.addMediaMessageToConversation(participantId, event);

      // Schedule a delayed response job
      await this.delayedResponseQueue.add(
        ProcessorName.PROCESS_DELAYED_RESPONSE,
        {
          participantId,
          messageId: lastMessageId,
          content: event.content || '',
        },
        {
          delay: 5000, // 5 seconds delay
        }
      );

      return {
        success: true,
        participantId,
        conversationId,
        action: 'added_media_message_with_delayed_response',
        mediaType: event.media.mediaType,
      };
    } catch (error) {
      this.logger.error(
        `Error processing private media message: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get file extension from mime type
   */
  private getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };

    return extensions[mimeType] || 'jpg';
  }

  /**
   * Process a message status changed event
   */
  private async processMessageStatusChanged(
    event: MessageStatusChangedEvent
  ): Promise<unknown> {
    this.logger.debug(
      `Processing message status changed: ${event.messageId} to ${event.status}`
    );

    // TODO: Update message status in the database

    return { success: true, action: 'logged_status_change' };
  }

  /**
   * Find or create a participant based on phone number
   */
  private async findOrCreateParticipant(phoneNumber: string, name?: string) {
    try {
      // Format the phone number to ensure consistency
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

      // Try to find existing participant
      const existingParticipant =
        await this.participantsService.findByPhoneNumber(formattedPhoneNumber);

      if (existingParticipant?.name === 'Unknown' && name) {
        await this.participantsService.update(existingParticipant.id, {
          name,
        });
      }

      if (existingParticipant) {
        return existingParticipant;
      }

      // Create new participant if not found
      const displayName = name || `User ${formattedPhoneNumber}`;
      return await this.participantsService.create({
        phoneNumber: formattedPhoneNumber,
        name: displayName,
      });
    } catch (error) {
      this.logger.error(
        `Failed to find or create participant: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw error;
    }
  }

  /**
   * Handle errors in a consistent way
   */
  private handleError(job: Job, error: unknown): void {
    if (error instanceof Error) {
      this.logger.error(`Error processing job ${job.id}: ${error.message}`, {
        error,
      });
    } else {
      this.logger.error(`Error processing job ${job.id}: Unknown error`);
    }
  }

  /**
   * Add a media message to a conversation without generating an immediate response
   * @param participantId - The participant ID
   * @param event - The message received event
   * @returns Object containing the conversation ID and last message ID
   */
  private async addMediaMessageToConversation(
    participantId: string,
    event: MessageReceivedEvent
  ): Promise<{
    conversationId: string;
    lastMessageId: string;
    mediaInfo: any;
  }> {
    if (!event.media) {
      throw new Error('No media data in event');
    }

    // For IMAGE type, handle base64Data
    if (event.media.mediaType === MessageMediaType.IMAGE) {
      const imageMedia = event.media as ImageMessageMedia;

      // If no base64 data, log and skip
      if (!imageMedia.base64Data) {
        this.logger.log(
          `Skipping image without base64 data, messageId: ${event.messageId}`
        );
        throw new Error('No base64 data in image media');
      }

      // Convert base64 to buffer
      const fileBuffer = Buffer.from(imageMedia.base64Data, 'base64');

      // Generate a unique key for S3
      const fileExtension = this.getFileExtension(
        imageMedia.mimetype || 'image/jpeg'
      );
      const s3Key = `private-messages/${participantId}/${Date.now()}-${uuidv4()}.${fileExtension}`;

      // Upload to S3
      const uploadResult = await this.s3Service.uploadFile(
        fileBuffer,
        s3Key,
        {
          contentType: imageMedia.mimetype || 'image/jpeg',
          participantId,
          messageId: event.messageId,
          source: 'whatsapp_private',
        },
        24 // 24 hours TTL
      );

      // Get the conversation for this participant
      const conversation =
        await this.conversationsService.getOrCreateGeneralConversation(
          participantId
        );

      // Add the media message to the conversation (without generating response)
      const mediaMessage = await this.conversationsService.addMessage({
        conversationId: conversation.id,
        type: MessageType.IMAGE_UPLOAD,
        photoId: uploadResult.key,
        content: event.content || '',
        metadata: {
          mimeType: imageMedia.mimetype || 'image/jpeg',
          s3Url: uploadResult.url,
          size: uploadResult.size,
          expiresAt: uploadResult.expiresAt.toISOString(),
          messageId: event.messageId,
        },
      });

      let lastMessageId = mediaMessage.id;

      // Also add a user message if there's content
      if (event.content?.trim()) {
        const textMessage = await this.conversationsService.addMessage({
          conversationId: conversation.id,
          type: MessageType.USER_MESSAGE,
          content: event.content,
          metadata: {
            messageId: event.messageId,
          },
        });

        lastMessageId = textMessage.id;
      }

      return {
        conversationId: conversation.id,
        lastMessageId,
        mediaInfo: {
          photoId: uploadResult.key,
          mimeType: imageMedia.mimetype || 'image/jpeg',
          s3Url: uploadResult.url,
          size: uploadResult.size,
          expiresAt: uploadResult.expiresAt.toISOString(),
        },
      };
    }

    throw new Error(`Unsupported media type: ${event.media.mediaType}`);
  }
}
