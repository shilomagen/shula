import { Processor, WorkerHost } from '@smangam/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import {
  DelayedResponseJobData,
  QueueName,
} from '../../../common/queue/queue.constants';
import { ConversationsService } from '../../conversations/conversations.service';
import { ParticipantsService } from '../../participants/participants.service';
import { WithContext } from '@shula/shared-queues';

/**
 * Processor for handling delayed responses to media messages
 * This processor checks if a message is still the latest in a conversation
 * before generating a response, allowing for debouncing of multiple media messages
 */
@Injectable()
@Processor(QueueName.DELAYED_RESPONSE, { concurrency: 50 })
export class DelayedResponseProcessor extends WorkerHost {
  private readonly logger = new ContextLogger(DelayedResponseProcessor.name);

  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly participantsService: ParticipantsService
  ) {
    super();
  }

  /**
   * Process a delayed response job
   * @param job - The job containing the delayed response data
   */
  @WithContext()
  async process(job: Job<DelayedResponseJobData>): Promise<unknown> {
    const { participantId, messageId } = job.data;
    this.logger.log(`Processing delayed response for messageId: ${messageId}`);

    try {
      // Get the conversations for this participant
      const conversations = await this.conversationsService.findByParticipantId(
        participantId
      );
      if (!conversations || conversations.length === 0) {
        throw new Error(
          `No conversations found for participant ${participantId}`
        );
      }

      // Get the general conversation (should be the first one)
      const conversation = conversations[0];

      // Get the messages for this conversation
      const messages = await this.conversationsService.getMessages(
        conversation.id
      );

      if (messages.length === 0) {
        this.logger.warn(
          `No messages found in conversation ${conversation.id}`
        );
        return { success: false, reason: 'no_messages_found' };
      }

      // Find the message we're responding to
      const targetMessage = messages.find((msg) => msg.id === messageId);
      if (!targetMessage) {
        this.logger.warn(
          `Message ${messageId} not found in conversation ${conversation.id}`
        );
        return { success: false, reason: 'message_not_found' };
      }

      // Check if this is still the latest message
      const latestMessage = messages[messages.length - 1];
      const isStillLatest = latestMessage.id === messageId;

      if (isStillLatest) {
        // If this is still the latest message, generate a response
        this.logger.log(
          `Generating response for conversation ${conversation.id}`
        );

        // Get the participant
        const participant = await this.participantsService.findById(
          participantId
        );
        if (!participant) {
          throw new Error(`Participant ${participantId} not found`);
        }

        // Use processIncomingMessage to generate a response
        await this.conversationsService.processIncomingMessage(
          participantId,
          '', // Empty string since we've already added the message
          undefined // No media info needed as we've already added it
        );

        return {
          success: true,
          action: 'generated_delayed_response',
          conversationId: conversation.id,
          messageId,
        };
      } else {
        // If it's not the latest message, skip generating a response
        this.logger.log(
          `Skipping response generation for messageId ${messageId} as it's no longer the latest message`
        );
        return {
          success: true,
          action: 'skipped_response_generation',
          reason: 'newer_message_exists',
        };
      }
    } catch (error) {
      this.logger.error(
        `Error processing delayed response: ${
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
}
