import { InjectQueue } from '@smangam/bullmq';
import { Injectable } from '@nestjs/common';
import {
  MessageEventType,
  MessageReceivedEvent,
  MessageStatusChangedEvent,
  QUEUE_NAMES,
} from '@shula/shared-queues';
import { Queue } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for handling message events queue operations
 */
@Injectable()
export class MessageEventsQueueService {
  private readonly logger = new ContextLogger(MessageEventsQueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.MESSAGE_PROCESSING)
    private readonly messageProcessingQueue: Queue<
      MessageReceivedEvent | MessageStatusChangedEvent
    >
  ) {}

  /**
   * Publish a message received event to the queue
   * @param event - The message received event data
   * @returns Promise<void>
   */
  async publishMessageReceivedEvent(
    event: Omit<MessageReceivedEvent, 'correlationId'>
  ): Promise<void> {
    try {
      // Add correlationId to the event
      const eventWithCorrelationId = {
        ...event,
        correlationId: uuidv4(),
      };

      this.logger.log(
        `Publishing message received event for message: ${eventWithCorrelationId.messageId}`,
        {
          correlationId: eventWithCorrelationId.correlationId,
          content: event.content,
        }
      );

      await this.messageProcessingQueue.add(
        MessageEventType.MESSAGE_RECEIVED,
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
        `Successfully published message received event for message: ${eventWithCorrelationId.messageId}`
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to publish message received event: ${error.message}`,
          error
        );
      } else {
        this.logger.error(
          'Failed to publish message received event: Unknown error'
        );
      }
      throw error;
    }
  }

  /**
   * Publish a message status changed event to the queue
   * @param event - The message status changed event data
   * @returns Promise<void>
   */
  async publishMessageStatusChangedEvent(
    event: Omit<MessageStatusChangedEvent, 'correlationId'>
  ): Promise<void> {
    try {
      // Add correlationId to the event
      const eventWithCorrelationId = {
        ...event,
        correlationId: uuidv4(),
      };

      this.logger.debug(
        `Publishing message status changed event for message: ${eventWithCorrelationId.messageId}`,
        {
          correlationId: eventWithCorrelationId.correlationId,
        }
      );

      await this.messageProcessingQueue.add(
        MessageEventType.MESSAGE_STATUS_CHANGED,
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
        `Successfully published message status changed event for message: ${eventWithCorrelationId.messageId}`
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to publish message status changed event: ${error.message}`,
          error
        );
      } else {
        this.logger.error(
          'Failed to publish message status changed event: Unknown error'
        );
      }
      throw error;
    }
  }
}
