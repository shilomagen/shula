import { InjectQueue } from '@smangam/bullmq';
import { Injectable } from '@nestjs/common';
import {
  PollEvent,
  PollEventType,
  PollVoteUpdateEvent,
  QUEUE_NAMES,
} from '@shula/shared-queues';
import { Queue } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for handling poll events queue operations
 */
@Injectable()
export class PollEventsQueueService {
  private readonly logger = new ContextLogger(PollEventsQueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.POLL_EVENTS)
    private readonly pollEventsQueue: Queue<PollEvent>
  ) {}

  /**
   * Publish a poll vote update event to the queue
   * @param event - The poll vote update event data
   * @returns Promise<void>
   */
  async publishPollVoteUpdateEvent(event: PollVoteUpdateEvent): Promise<void> {
    try {
      // Add correlationId to the event
      const eventWithCorrelationId = {
        ...event,
        correlationId: uuidv4(),
      };

      this.logger.log(
        `Publishing poll vote update event for poll: ${eventWithCorrelationId.pollMessageId}, correlationId: ${eventWithCorrelationId.correlationId}`
      );

      await this.pollEventsQueue.add(
        PollEventType.POLL_VOTE_UPDATE,
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
        `Successfully published poll vote update event for poll: ${eventWithCorrelationId.pollMessageId}`
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to publish poll vote update event: ${error.message}`,
          error
        );
      } else {
        this.logger.error(
          'Failed to publish poll vote update event: Unknown error'
        );
      }
      throw error;
    }
  }
}
