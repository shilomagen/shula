import { Processor, WorkerHost } from '@smangam/bullmq';
import { Injectable } from '@nestjs/common';
import {
  GroupEvent,
  GroupEventType,
  QUEUE_NAMES,
  WithContext,
} from '@shula/shared-queues';
import { Job } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import { match } from 'ts-pattern';
import { GroupAdminEventHandler } from './handlers/group-admin-event.handler';
import { GroupJoinEventHandler } from './handlers/group-join-event.handler';
import { GroupLeaveEventHandler } from './handlers/group-leave-event.handler';
import { GroupParticipantsSyncEventHandler } from './handlers/group-participants-sync-event.handler';
import { MetricsService } from '@shula/observability';
/**
 * Processor for handling WhatsApp group events from the queue
 */
@Processor(QUEUE_NAMES.GROUP_MANAGEMENT, { concurrency: 50 })
@Injectable()
export class GroupEventsProcessor extends WorkerHost {
  private readonly logger = new ContextLogger(GroupEventsProcessor.name);

  constructor(
    private readonly groupJoinEventHandler: GroupJoinEventHandler,
    private readonly groupLeaveEventHandler: GroupLeaveEventHandler,
    private readonly groupAdminEventHandler: GroupAdminEventHandler,
    private readonly groupParticipantsSyncEventHandler: GroupParticipantsSyncEventHandler,
    private readonly metricsService: MetricsService
  ) {
    super();
  }

  /**
   * Process jobs from the queue
   * @param job - The job to process
   */
  @WithContext()
  async process(job: Job<GroupEvent>): Promise<void> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);
    const event = job.data;
    this.metricsService.incrementCounter('group_event_total', 1, {
      type: event.eventType,
    });
    try {
      await match(event)
        .with({ eventType: GroupEventType.GROUP_JOINED }, (event) =>
          this.groupJoinEventHandler.handle(event)
        )
        .with({ eventType: GroupEventType.GROUP_LEFT }, (event) =>
          this.groupLeaveEventHandler.handle(event)
        )
        .with({ eventType: GroupEventType.GROUP_ADMIN_CHANGED }, (event) =>
          this.groupAdminEventHandler.handle(event)
        )
        .with({ eventType: GroupEventType.GROUP_PARTICIPANTS_SYNC }, (event) =>
          this.groupParticipantsSyncEventHandler.handle(event)
        )
        .exhaustive();
    } catch (error) {
      this.logger.error(`Error processing job ${job.id}`, { error });
      throw error;
    }
  }

  /**
   * Handle job completion
   * @param job The completed job
   * @param result The result of the job
   */
  onCompleted(job: Job<GroupEvent>, result: void): void {
    this.logger.debug(`Job ${job.id} completed successfully`);
  }

  /**
   * Handle job failure
   * @param job The failed job
   * @param error The error that caused the failure
   */
  onFailed(job: Job<GroupEvent>, error: Error): void {
    this.logger.error(`Job ${job.id} failed with error:`, { error });
  }
}
