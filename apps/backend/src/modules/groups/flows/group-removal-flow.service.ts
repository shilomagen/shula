import { InjectFlowProducer } from '@smangam/bullmq';
import { Injectable } from '@nestjs/common';
import { FlowProducer } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import {
  GroupRemovalFlowData,
  ProcessorName,
  QueueName,
  RemoveGroupJobData,
  RemoveParticipantJobData,
} from '../../../common/queue/queue.constants';
import { ParticipantsResponseDto } from '../../participants/dto/participants-response.dto';

/**
 * Service for managing group removal flows
 */
@Injectable()
export class GroupRemovalFlowService {
  private readonly logger = new ContextLogger(GroupRemovalFlowService.name);

  constructor(
    @InjectFlowProducer(QueueName.GROUP_REMOVAL)
    private readonly flowProducer: FlowProducer
  ) {}

  /**
   * Queue a group removal flow with participant removals as child jobs
   * @param flowData The data for the group removal flow
   * @param participants The participants to remove from the group
   * @returns The flow job ID
   * @throws Error if flow creation fails
   */
  async queueGroupRemovalFlow(
    flowData: GroupRemovalFlowData,
    participants: ParticipantsResponseDto[]
  ): Promise<string> {
    try {
      this.logger.log(
        `Creating group removal flow for group ${flowData.groupName} (${flowData.groupId}) with ${participants.length} participants`
      );

      // Default job options
      const defaultOptions = {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      };

      // Create child jobs for each participant removal
      const childJobs = participants.map((participant) => ({
        name: ProcessorName.REMOVE_PARTICIPANT,
        data: {
          participantId: participant.id,
          groupId: flowData.groupId,
          participantName: participant.name,
        } as RemoveParticipantJobData,
        queueName: QueueName.PARTICIPANT_OPERATIONS,
        opts: defaultOptions,
      }));

      // Create the flow with parent and child jobs
      const flow = await this.flowProducer.add({
        name: ProcessorName.REMOVE_GROUP,
        queueName: QueueName.GROUP_REMOVAL,
        data: {
          groupId: flowData.groupId,
          groupName: flowData.groupName,
          whatsappGroupId: flowData.whatsappGroupId,
        } as RemoveGroupJobData,
        opts: defaultOptions,
        children: childJobs,
      });

      if (!flow.job.id) {
        throw new Error('Failed to create flow: No job ID returned');
      }

      this.logger.log(
        `Created group removal flow with ID ${flow.job.id} for group ${flowData.groupName} (${flowData.groupId})`
      );

      return flow.job.id;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to create group removal flow for group ${flowData.groupId}: ${errorMessage}`,
        { error }
      );
      throw error;
    }
  }
}
