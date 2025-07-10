import { Processor, WorkerHost } from '@smangam/bullmq';
import { NotFoundException } from '@nestjs/common';
import { Job } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import {
  QueueName,
  RemoveGroupJobData,
} from '../../../common/queue/queue.constants';
import { GroupsService } from '../groups.service';
import { WithContext } from '@shula/shared-queues';
import { MetricsService } from '@shula/observability';

/**
 * Processor for handling group removal
 * This processor is triggered after all participant removal jobs are complete
 */
@Processor(QueueName.GROUP_REMOVAL, { concurrency: 50 })
export class GroupRemovalProcessor extends WorkerHost {
  private readonly logger = new ContextLogger(GroupRemovalProcessor.name);

  constructor(
    private readonly groupsService: GroupsService,
    private readonly metricsService: MetricsService
  ) {
    super();
  }

  /**
   * Process a group removal job
   * This will be executed after all participant removals are complete
   * @param job The job containing the group data
   * @returns Result of the operation
   */
  @WithContext()
  async process(job: Job<RemoveGroupJobData>): Promise<{ success: boolean }> {
    this.logger.log(
      `Processing group removal for group ${job.data.groupName} (${job.data.groupId})`
    );
    this.metricsService.incrementCounter('group_removal_total', 1, {});

    try {
      try {
        // Check if the group still exists by trying to get it
        await this.groupsService.findOne(job.data.groupId);

        // Group exists, delete it
        await this.groupsService.remove(job.data.groupId);

        this.logger.log(
          `Successfully deleted group ${job.data.groupName} (${job.data.groupId})`
        );
        return { success: true };
      } catch (error: unknown) {
        // If group not found, consider it success as it might have been already deleted
        if (error instanceof NotFoundException) {
          this.logger.warn(
            `Group ${job.data.groupId} not found, it may have been already deleted`
          );
          return { success: true };
        }
        // Re-throw other errors
        throw error;
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to delete group ${job.data.groupId}: ${errorMessage}`,
        { error }
      );
      throw error;
    }
  }

  /**
   * Handle job completion
   * @param job The completed job
   * @param result The result of the job
   */
  onCompleted(
    job: Job<RemoveGroupJobData>,
    result: { success: boolean }
  ): void {
    this.logger.log(
      `Group removal job for ${job.data.groupName} (${job.data.groupId}) completed successfully`
    );
  }

  /**
   * Handle job failure
   * @param job The failed job
   * @param error The error that caused the failure
   */
  onFailed(job: Job<RemoveGroupJobData>, error: Error): void {
    this.logger.error(
      `Group removal job for ${job.data.groupName} (${job.data.groupId}) failed: ${error.message}`,
      { error }
    );
  }
}
