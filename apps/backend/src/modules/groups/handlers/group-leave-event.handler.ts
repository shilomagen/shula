import { InjectQueue } from '@smangam/bullmq';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GroupLeftEvent } from '@shula/shared-queues';
import { Queue } from 'bullmq';
import { ContextLogger } from 'nestjs-context-logger';
import {
  GroupRemovalFlowData,
  ProcessorName,
  QueueName,
  RemoveParticipantJobData,
} from '../../../common/queue/queue.constants';
import { formatPhoneNumber } from '../../../common/utils';
import { ParticipantsService } from '../../participants/participants.service';
import { GroupRemovalFlowService } from '../flows/group-removal-flow.service';
import { GroupsService } from '../groups.service';

@Injectable()
export class GroupLeaveEventHandler {
  private readonly logger = new ContextLogger(GroupLeaveEventHandler.name);
  private readonly shulaPhoneNumber: string;

  constructor(
    private readonly groupsService: GroupsService,
    private readonly participantsService: ParticipantsService,
    private readonly configService: ConfigService,
    private readonly groupRemovalFlowService: GroupRemovalFlowService,
    @InjectQueue(QueueName.PARTICIPANT_OPERATIONS)
    private readonly participantOperationsQueue: Queue<RemoveParticipantJobData>
  ) {
    this.shulaPhoneNumber =
      this.configService.get<string>('shula.phoneNumber') || '+972552654166';
  }

  async handle(event: GroupLeftEvent): Promise<void> {
    this.logger.log(`Processing group leave event for ${event.groupId}`);

    const removedUsers = event.removedUsers.map(formatPhoneNumber);
    this.logger.log(`Removed users: ${removedUsers.join(', ') || 'None'}`);

    const isBotAffected = this.isBotInUsers(removedUsers);
    this.logger.log(`Is bot affected: ${isBotAffected ? 'Yes' : 'No'}`);

    if (isBotAffected) {
      await this.handleBotRemoved(event);
    } else {
      await this.handleParticipantsRemoved(event);
    }
  }

  private isBotInUsers(userIds: string[]): boolean {
    return userIds.some((id) => id === this.shulaPhoneNumber);
  }

  private async handleBotRemoved(event: GroupLeftEvent): Promise<void> {
    this.logger.log(`Bot was removed from group ${event.groupId}`);

    const group = await this.groupsService.findByWhatsAppId(event.groupId);

    this.logger.log(`Found group to remove: ${group.name} (${group.id})`);

    const participants = await this.participantsService.findByGroupId(group.id);
    this.logger.log(`Group has ${participants.length} participants to process`);

    const flowData: GroupRemovalFlowData = {
      groupId: group.id,
      groupName: group.name,
      whatsappGroupId: group.whatsappGroupId,
    };

    try {
      const flowId = await this.groupRemovalFlowService.queueGroupRemovalFlow(
        flowData,
        participants
      );
      this.logger.log(`Queued group removal flow with ID: ${flowId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to queue group removal flow: ${errorMessage}`, {
        error,
      });
      throw new Error(`Failed to handle bot removal: ${errorMessage}`);
    }
  }

  private async handleParticipantsRemoved(
    event: GroupLeftEvent
  ): Promise<void> {
    this.logger.log(`Participants were removed from group ${event.groupId}`);

    if (!event.removedUsers || event.removedUsers.length === 0) {
      this.logger.warn(`No removed users in event data`);
      return;
    }

    const group = await this.groupsService.findByWhatsAppId(event.groupId);

    const formattedRemovedUsers = event.removedUsers.map((id) =>
      formatPhoneNumber(id)
    );

    for (const phoneNumber of formattedRemovedUsers) {
      await this.handleParticipantRemoval(phoneNumber, group.id);
    }

    this.logger.log(
      `Completed participant removal processing for group ${group.id}`
    );
  }

  async handleParticipantRemoval(
    phoneNumber: string,
    groupId: string
  ): Promise<void> {
    try {
      const participant = await this.participantsService.findByPhoneNumber(
        phoneNumber
      );
      if (!participant) {
        this.logger.warn(`Participant not found: ${phoneNumber}`);
        return;
      }

      this.logger.log(`Processing removal of participant ${participant.id}`);

      await this.participantOperationsQueue.add(
        ProcessorName.REMOVE_PARTICIPANT,
        {
          participantId: participant.id,
          groupId,
        }
      );

      this.logger.log(
        `Successfully queued removal process for participant ${participant.id} from group ${groupId}`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling group leave event: ${errorMessage}`, {
        error,
      });
      throw error;
    }
  }
}
