import { Processor, WorkerHost } from '@smangam/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import {
  ProcessorName,
  QueueName,
  RemoveParticipantJobData,
} from '../../../common/queue/queue.constants';
import { GroupParticipantsService } from '../../group-participants/group-participants.service';
import { PersonsService } from '../../persons/persons.service';
import { ParticipantsService } from '../participants.service';
import { WithContext } from '@shula/shared-queues';

/**
 * Processor for handling participant removal from groups
 */
@Injectable()
@Processor(QueueName.PARTICIPANT_OPERATIONS, { concurrency: 50 })
export class ParticipantRemovalProcessor extends WorkerHost {
  private readonly logger = new ContextLogger(ProcessorName.REMOVE_PARTICIPANT);

  constructor(
    private readonly groupParticipantsService: GroupParticipantsService,
    private readonly personsService: PersonsService,
    private readonly participantsService: ParticipantsService
  ) {
    super();
  }

  /**
   * Process a participant removal job
   * @param job The job containing participant and group IDs
   */
  @WithContext()
  async process(job: Job<RemoveParticipantJobData>): Promise<void> {
    const { participantId, groupId } = job.data;
    this.logger.debug(
      `Processing removal of participant ${participantId} from group ${groupId}`
    );

    try {
      // Step 1: Remove the GroupParticipant record
      await this.groupParticipantsService.removeParticipantFromGroup(
        participantId,
        groupId
      );
      this.logger.debug(
        `Removed participant ${participantId} from group ${groupId}`
      );

      // Step 2: Remove associated Person records
      await this.removePersonsForParticipantInGroup(participantId, groupId);

      // Step 3: Check if participant should be completely removed
      await this.checkAndRemoveParticipant(participantId);

      this.logger.log(
        `Successfully completed removal for participant ${participantId}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error processing participant removal: ${errorMessage}`,
        { error }
      );
      throw error;
    }
  }

  /**
   * Removes all Person records owned by the participant in the specified group
   */
  private async removePersonsForParticipantInGroup(
    participantId: string,
    groupId: string
  ): Promise<void> {
    await this.personsService.removePersonsByParticipantAndGroup(
      participantId,
      groupId
    );
  }

  /**
   * Checks if participant belongs to any other groups and removes if not
   */
  private async checkAndRemoveParticipant(
    participantId: string
  ): Promise<void> {
    // Get remaining groups for this participant
    const remainingGroups =
      await this.groupParticipantsService.findGroupsByParticipantId(
        participantId
      );

    // If no remaining groups, remove the participant
    if (remainingGroups.length === 0) {
      this.logger.debug(
        `Participant ${participantId} has no remaining groups, removing completely`
      );
      await this.participantsService.delete(participantId);
    } else {
      this.logger.debug(
        `Participant ${participantId} still belongs to ${remainingGroups.length} groups, keeping record`
      );
    }
  }

  /**
   * Handle job completion
   * @param job The completed job
   * @param result The result of the job
   */
  onCompleted(job: Job<RemoveParticipantJobData>): void {
    this.logger.debug(`Job ${job.id} completed successfully`);
  }

  /**
   * Handle job failure
   * @param job The failed job
   * @param error The error that caused the failure
   */
  onFailed(job: Job<RemoveParticipantJobData>, error: Error): void {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`, {
      error,
    });
  }
}
