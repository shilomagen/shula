import { InjectQueue } from '@smangam/bullmq';
import { Injectable } from '@nestjs/common';
import {
  MessageReactionAddedEvent,
  MessageReactionEvent,
  MessageReactionEventType,
  MessageReactionRemovedEvent,
  QUEUE_NAMES,
} from '@shula/shared-queues';
import { Queue } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import { Reaction } from 'whatsapp-web.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for handling message reaction queue operations
 */
@Injectable()
export class MessageReactionsQueueService {
  private readonly logger = new ContextLogger(
    MessageReactionsQueueService.name
  );

  constructor(
    @InjectQueue(QUEUE_NAMES.MESSAGE_REACTIONS)
    private readonly messageReactionsQueue: Queue<MessageReactionEvent>
  ) {}

  /**
   * Publish a message reaction event to the queue
   * @param event - The message reaction event data
   * @returns Promise<void>
   */
  async publishMessageReactionEvent(
    event: MessageReactionEvent
  ): Promise<void> {
    try {
      // Add correlationId to the event
      const eventWithCorrelationId = {
        ...event,
        correlationId: uuidv4(),
      };

      this.logger.log(
        `Publishing message reaction event, correlationId: ${eventWithCorrelationId.correlationId}`
      );

      await this.messageReactionsQueue.add(
        eventWithCorrelationId.eventType,
        eventWithCorrelationId,
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        }
      );

      this.logger.log(
        `Successfully published message reaction event, correlationId: ${eventWithCorrelationId.correlationId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish message reaction event: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw error;
    }
  }

  /**
   * Publish a message reaction added event to the queue
   * @param data - The raw message reaction data from WhatsApp
   * @returns Promise<void>
   */
  async publishReactionAddedEvent(data: Reaction): Promise<void> {
    const event: MessageReactionAddedEvent = {
      eventType: MessageReactionEventType.MESSAGE_REACTION_ADDED,
      ...data,
      timestamp: data.timestamp,
      remote: data.msgId.remote,
      correlationId: '', // Will be set in publishMessageReactionEvent
    };

    return this.publishMessageReactionEvent(event);
  }

  /**
   * Publish a message reaction removed event to the queue
   * @param data - The raw message reaction data from WhatsApp
   * @returns Promise<void>
   */
  async publishReactionRemovedEvent(data: Reaction): Promise<void> {
    const event: MessageReactionRemovedEvent = {
      eventType: MessageReactionEventType.MESSAGE_REACTION_REMOVED,
      ...data,
      timestamp: data.timestamp,
      remote: data.msgId.remote,
      correlationId: '', // Will be set in publishMessageReactionEvent
    };

    return this.publishMessageReactionEvent(event);
  }
}
