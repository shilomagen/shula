import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsentResponseType } from '@prisma/client';
import { GroupJoinedEvent } from '@shula/shared-queues';
import { ContextLogger } from 'nestjs-context-logger';
import { formatPhoneNumber } from '../../../common/utils';
import { GroupMessagesService } from '../../group-messages/group-messages.service';
import { ParticipantConsentsService } from '../../participant-consents/participant-consents.service';
import { ParticipantsService } from '../../participants/participants.service';
import { GroupsService } from '../groups.service';

@Injectable()
export class GroupJoinEventHandler {
  private readonly logger = new ContextLogger(GroupJoinEventHandler.name);
  private readonly shulaPhoneNumber: string;

  constructor(
    private readonly groupsService: GroupsService,
    private readonly participantsService: ParticipantsService,
    private readonly groupMessagesService: GroupMessagesService,
    private readonly participantConsentsService: ParticipantConsentsService,
    private readonly configService: ConfigService
  ) {
    this.shulaPhoneNumber =
      this.configService.get<string>('shula.phoneNumber') || '+972552654166';
  }

  async handle(event: GroupJoinedEvent): Promise<void> {
    this.logger.log(`Processing group joined event for ${event.groupId}`);

    const addedUsers = event.addedUsers.map(formatPhoneNumber);
    this.logger.log(`Added users: ${addedUsers.join(', ') || 'None'}`);

    const isBotAffected = this.isBotInUsers(addedUsers);
    this.logger.log(`Is bot affected: ${isBotAffected ? 'Yes' : 'No'}`);

    if (isBotAffected) {
      await this.handleBotJoined(event);
    } else {
      await this.handleParticipantsAdded(event);
    }
  }

  private isBotInUsers(userIds: string[]): boolean {
    return userIds.some((id) => id === this.shulaPhoneNumber);
  }

  private async handleBotJoined(event: GroupJoinedEvent): Promise<void> {
    this.logger.log(`Bot was added to group ${event.groupId}`);

    const group = await this.groupsService.findOrCreateByWhatsAppId(
      event.groupId,
      event.groupName || 'WhatsApp Group',
      `Group created automatically from WhatsApp. Added by: ${
        event.initiatorName || 'Unknown'
      }`
    );

    this.logger.log(`Found or created group: ${group.id}`);

    if (event.participants && event.participants.length > 0) {
      const formattedParticipants = event.participants
        .map((p) => ({
          ...p,
          id: formatPhoneNumber(p.id),
        }))
        .filter((p) => p.id !== this.shulaPhoneNumber);

      this.logger.log(
        `Processing ${formattedParticipants.length} participants`
      );

      await Promise.all(
        formattedParticipants.map((p) =>
          this.addParticipantToGroup(p, group.id)
        )
      );
    }

    await this.handleIntroMessage(event, group);
    await this.createConsentRecords(group.id);
  }

  async handleParticipantsAdded(event: GroupJoinedEvent): Promise<void> {
    this.logger.log(`Participants were added to group ${event.groupId}`);

    try {
      const group = await this.groupsService.findByWhatsAppId(event.groupId);

      if (!event.addedUsers || event.addedUsers.length === 0) {
        this.logger.warn(`No added users in the event data`);
        return;
      }

      const formattedAddedUsers = event.addedUsers.map(formatPhoneNumber);
      const addedParticipants = (event.participants || [])
        .map((p) => ({
          ...p,
          id: formatPhoneNumber(p.id),
        }))
        .filter((p) => formattedAddedUsers.includes(p.id));

      if (addedParticipants.length === 0) {
        this.logger.warn(`No added participants found in participants list`);
        return;
      }

      this.logger.log(
        `Processing ${addedParticipants.length} newly added participants`
      );

      await Promise.all(
        addedParticipants.map((p) =>
          this.participantsService.findOrCreateAndAddToGroup(
            p.id,
            group.id,
            p.name || 'Unknown'
          )
        )
      );

      await this.createConsentRecordsForParticipants(
        group.id,
        addedParticipants.map((p) => p.id)
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.error(`Group not found: ${event.groupId}`);
        return;
      }
      throw error;
    }
  }

  async addParticipantToGroup(
    participant: { id: string; name?: string; isAdmin?: boolean },
    groupId: string
  ): Promise<void> {
    const phoneNumber = participant.id;
    await this.participantsService.findOrCreateAndAddToGroup(
      phoneNumber,
      groupId,
      participant.name || 'Unknown'
    );
    this.logger.log(`Added participant ${phoneNumber} to group ${groupId}`);
  }

  private async handleIntroMessage(
    event: GroupJoinedEvent,
    group: any
  ): Promise<void> {
    try {
      await this.groupMessagesService.sendGroupAddedDisabledMessage(
        event.groupId,
        group.name
      );
      this.logger.log(`Sent intro message successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to send intro message: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  private async createConsentRecords(groupId: string): Promise<void> {
    try {
      const participants = await this.participantsService.findByGroupId(
        groupId
      );
      if (participants.length === 0) {
        this.logger.log(`No participants to create consent records for`);
        return;
      }

      const createDtos = participants.map((p) => ({
        groupId,
        participantId: p.id,
        consentStatus: ConsentResponseType.pending,
      }));

      await this.participantConsentsService.createMany(createDtos);
      this.logger.log(
        `Created consent records for ${participants.length} participants`
      );
    } catch (error) {
      this.logger.error(
        `Failed to create consent records: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  async createConsentRecordsForParticipants(
    groupId: string,
    phoneNumbers: string[]
  ): Promise<void> {
    try {
      const participantEntities = await Promise.all(
        phoneNumbers.map(async (phoneNumber) => {
          return await this.participantsService.findByPhoneNumber(phoneNumber);
        })
      );

      const participantIds = participantEntities
        .filter(Boolean)
        .map((p) => p!.id);

      if (participantIds.length === 0) {
        this.logger.log(`No participants found to create consent records for`);
        return;
      }

      const createDtos = participantIds.map((id) => ({
        groupId,
        participantId: id,
        consentStatus: ConsentResponseType.pending,
      }));

      await this.participantConsentsService.createMany(createDtos);
      this.logger.log(
        `Created consent records for ${participantIds.length} new participants`
      );
    } catch (error) {
      this.logger.error(
        `Failed to create consent records: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
