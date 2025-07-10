import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GroupEventType,
  GroupJoinedEvent,
  GroupParticipantsSyncEvent,
} from '@shula/shared-queues';
import { ContextLogger } from 'nestjs-context-logger';
import { formatPhoneNumber } from '../../../common/utils';
import { ParticipantsService } from '../../participants/participants.service';
import { GroupsService } from '../groups.service';
import { GroupJoinEventHandler } from './group-join-event.handler';
import { GroupLeaveEventHandler } from './group-leave-event.handler';

@Injectable()
export class GroupParticipantsSyncEventHandler {
  private readonly logger = new ContextLogger(
    GroupParticipantsSyncEventHandler.name
  );
  private readonly shulaPhoneNumber: string;

  constructor(
    private readonly groupsService: GroupsService,
    private readonly participantsService: ParticipantsService,
    private readonly groupJoinEventHandler: GroupJoinEventHandler,
    private readonly groupLeaveEventHandler: GroupLeaveEventHandler,
    private readonly configService: ConfigService
  ) {
    this.shulaPhoneNumber =
      this.configService.get<string>('shula.phoneNumber') || '+972552654166';
  }

  async handle(event: GroupParticipantsSyncEvent): Promise<void> {
    this.logger.log(`Processing group participants sync for ${event.groupId}`);

    try {
      await this.syncParticipants(event);
      this.logger.log(
        `Successfully synced participants for group ${event.groupId}`
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync participants for group ${event.groupId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    }
  }

  private async syncParticipants(
    event: GroupParticipantsSyncEvent
  ): Promise<void> {
    // Find or create the group
    let group;
    try {
      group = await this.groupsService.findByWhatsAppId(event.groupId);
      this.logger.log(`Found existing group: ${group.id} (${group.name})`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Group doesn't exist yet, create it
        this.logger.log(`Group ${event.groupId} not found, creating it`);
        group = await this.groupsService.findOrCreateByWhatsAppId(
          event.groupId,
          event.groupName || 'WhatsApp Group',
          'Group created during participant sync'
        );
        this.logger.log(`Created new group: ${group.id} (${group.name})`);
      } else {
        throw error;
      }
    }

    // Format WhatsApp participants
    const whatsappParticipants = event.participants
      .map((p) => ({
        ...p,
        id: formatPhoneNumber(p.id),
      }))
      .filter((p) => p.id !== this.shulaPhoneNumber); // Filter out the bot itself

    this.logger.log(
      `WhatsApp participants (${
        whatsappParticipants.length
      }): ${whatsappParticipants.map((p) => p.id).join(', ')}`
    );

    // Get current participants from database
    const dbParticipants = await this.participantsService.findByGroupId(
      group.id
    );
    this.logger.log(
      `Database participants (${dbParticipants.length}): ${dbParticipants
        .map((p) => p.phoneNumber)
        .join(', ')}`
    );

    // Find participants to add (in WhatsApp but not in DB)
    const participantsToAdd = whatsappParticipants.filter(
      (whatsappP) =>
        !dbParticipants.some((dbP) => dbP.phoneNumber === whatsappP.id)
    );

    // Find participants to remove (in DB but not in WhatsApp)
    const participantsToRemove = dbParticipants.filter(
      (dbP) =>
        !whatsappParticipants.some(
          (whatsappP) => dbP.phoneNumber === whatsappP.id
        )
    );

    this.logger.log(`Participants to add: ${participantsToAdd.length}`);
    this.logger.log(`Participants to remove: ${participantsToRemove.length}`);

    // Process participants to add
    if (participantsToAdd.length > 0) {
      await this.addNewParticipants(event, group.id, participantsToAdd);
    }

    // Process participants to remove
    if (participantsToRemove.length > 0) {
      await this.removeParticipants(group.id, participantsToRemove);
    }
  }

  private async addNewParticipants(
    event: GroupParticipantsSyncEvent,
    groupId: string,
    participantsToAdd: Array<{ id: string; name?: string; isAdmin?: boolean }>
  ): Promise<void> {
    this.logger.log(
      `Adding ${participantsToAdd.length} new participants to group ${groupId}`
    );

    try {
      // Create a GroupJoinedEvent from the sync event data
      const joinEvent: GroupJoinedEvent = {
        eventType: GroupEventType.GROUP_JOINED,
        timestamp: new Date(),
        groupId: groupId,
        groupName: event.groupName,
        isReadOnly: false,
        participants: event.participants,
        addedUsers: participantsToAdd.map((p) => p.id),
        metadata: event.metadata,
        correlationId: event.correlationId,
      };

      await this.groupJoinEventHandler.handleParticipantsAdded(joinEvent);
      this.logger.log(
        `Successfully processed ${participantsToAdd.length} new participants with join event handler`
      );
    } catch (error) {
      this.logger.error(
        `Failed to process new participants for group ${groupId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  private async removeParticipants(
    groupId: string,
    participantsToRemove: Array<{ id: string; phoneNumber: string }>
  ): Promise<void> {
    this.logger.log(
      `Removing ${participantsToRemove.length} participants from group ${groupId}`
    );

    for (const participant of participantsToRemove) {
      try {
        await this.groupLeaveEventHandler.handleParticipantRemoval(
          participant.phoneNumber,
          groupId
        );
        this.logger.log(
          `Removed participant ${participant.phoneNumber} from group ${groupId}`
        );
      } catch (error) {
        this.logger.error(
          `Failed to remove participant ${
            participant.phoneNumber
          } from group ${groupId}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  }
}
