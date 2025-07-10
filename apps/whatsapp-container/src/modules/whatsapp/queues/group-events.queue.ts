import { InjectQueue } from '@smangam/bullmq';
import { Injectable } from '@nestjs/common';
import {
  GroupAdminChangedEvent,
  GroupEvent,
  GroupEventType,
  GroupJoinedEvent,
  GroupLeftEvent,
  GroupParticipantsSyncEvent,
  QUEUE_NAMES,
} from '@shula/shared-queues';
import { Queue } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for handling group events queue operations
 */
@Injectable()
export class GroupEventsQueueService {
  private readonly logger = new ContextLogger(GroupEventsQueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.GROUP_MANAGEMENT)
    private readonly groupManagementQueue: Queue<GroupEvent>
  ) {}

  /**
   * Publish a group joined event to the queue
   * @param event - The group joined event data
   * @returns Promise<void>
   */
  async publishGroupJoinedEvent(
    event: Omit<GroupJoinedEvent, 'correlationId'>
  ): Promise<void> {
    try {
      // Add correlationId to the event
      const eventWithCorrelationId = {
        ...event,
        correlationId: uuidv4(),
      };

      this.logger.log(
        `Publishing group joined event for group: ${eventWithCorrelationId.groupId}, correlationId: ${eventWithCorrelationId.correlationId}`
      );

      await this.groupManagementQueue.add(
        GroupEventType.GROUP_JOINED,
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
        `Successfully published group joined event for group: ${eventWithCorrelationId.groupId}`
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to publish group joined event: ${error.message}`,
          error
        );
      } else {
        this.logger.error(
          'Failed to publish group joined event: Unknown error'
        );
      }
      throw error;
    }
  }

  /**
   * Publish a group left event to the queue
   * @param event - The group left event data
   * @returns Promise<void>
   */
  async publishGroupLeftEvent(
    event: Omit<GroupLeftEvent, 'correlationId'>
  ): Promise<void> {
    try {
      // Add correlationId to the event
      const eventWithCorrelationId = {
        ...event,
        correlationId: uuidv4(),
      };

      this.logger.log(
        `Publishing group left event for group: ${eventWithCorrelationId.groupId}, correlationId: ${eventWithCorrelationId.correlationId}`
      );

      await this.groupManagementQueue.add(
        GroupEventType.GROUP_LEFT,
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
        `Successfully published group left event for group: ${eventWithCorrelationId.groupId}`
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to publish group left event: ${error.message}`,
          error
        );
      } else {
        this.logger.error('Failed to publish group left event: Unknown error');
      }
      throw error;
    }
  }

  /**
   * Publish a group admin changed event to the queue
   * @param event - The group admin changed event data
   * @returns Promise<void>
   */
  async publishGroupAdminChangedEvent(
    event: Omit<GroupAdminChangedEvent, 'correlationId'>
  ): Promise<void> {
    try {
      // Add correlationId to the event
      const eventWithCorrelationId = {
        ...event,
        correlationId: uuidv4(),
      };

      this.logger.log(
        `Publishing group admin changed event for group: ${eventWithCorrelationId.groupId}, participant: ${eventWithCorrelationId.participantId}, correlationId: ${eventWithCorrelationId.correlationId}`
      );

      await this.groupManagementQueue.add(
        GroupEventType.GROUP_ADMIN_CHANGED,
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
        `Successfully published group admin changed event for group: ${eventWithCorrelationId.groupId}`
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to publish group admin changed event: ${error.message}`,
          error
        );
      } else {
        this.logger.error(
          'Failed to publish group admin changed event: Unknown error'
        );
      }
      throw error;
    }
  }

  /**
   * Publish a group participants sync event to the queue
   * @param event - The group participants sync event data
   * @returns Promise<void>
   */
  async publishGroupParticipantsSyncEvent(
    event: Omit<GroupParticipantsSyncEvent, 'correlationId'>
  ): Promise<void> {
    try {
      // Add correlationId to the event
      const eventWithCorrelationId = {
        ...event,
        correlationId: uuidv4(),
      };

      this.logger.log(
        `Publishing group participants sync event for group: ${eventWithCorrelationId.groupId}, correlationId: ${eventWithCorrelationId.correlationId}`
      );

      await this.groupManagementQueue.add(
        GroupEventType.GROUP_PARTICIPANTS_SYNC,
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
        `Successfully published group participants sync event for group: ${eventWithCorrelationId.groupId}`
      );
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to publish group participants sync event: ${error.message}`,
          error
        );
      } else {
        this.logger.error(
          'Failed to publish group participants sync event: Unknown error'
        );
      }
      throw error;
    }
  }
}
