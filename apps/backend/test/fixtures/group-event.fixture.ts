import { Group } from '@prisma/client';
import {
  GroupEventType,
  GroupJoinedEvent,
  GroupLeftEvent,
} from '@shula/shared-queues';

// Test Constants that can be used across tests
export const BOT_PHONE_NUMBER = '+972552654166';
export const TEST_GROUP_ID = '123456789@g.us';
export const TEST_PARTICIPANT_ID = '972506777014@c.us';
export const FORMATTED_PARTICIPANT_ID = '+972506777014';

export class GroupEventFixture {
  static createParticipant(id: string, name: string, isAdmin = false) {
    return {
      id,
      name,
      isAdmin,
    };
  }

  static createBotParticipant() {
    return this.createParticipant(
      BOT_PHONE_NUMBER.replace('+', '') + '@c.us',
      'Bot',
      true
    );
  }

  static createTestParticipant() {
    return this.createParticipant(TEST_PARTICIPANT_ID, 'Test Participant');
  }

  static createGroupJoinEvent({
    groupId = TEST_GROUP_ID,
    groupName = 'Test Group',
    participants = [this.createBotParticipant(), this.createTestParticipant()],
    addedUsers = [BOT_PHONE_NUMBER.replace('+', '') + '@c.us'],
    initiatorId = '972501234567@c.us',
    initiatorName = 'Test User',
    isReadOnly = false,
  }: {
    groupId?: string;
    groupName?: string;
    participants?: Array<{ id: string; name: string; isAdmin: boolean }>;
    addedUsers?: string[];
    initiatorId?: string;
    initiatorName?: string;
    isReadOnly?: boolean;
  } = {}): GroupJoinedEvent {
    return {
      eventType: GroupEventType.GROUP_JOINED,
      timestamp: new Date(),
      groupId,
      groupName,
      initiatorId,
      initiatorName,
      isReadOnly,
      participants,
      addedUsers,
      metadata: {},
    };
  }

  static createGroupLeaveEvent({
    groupId = TEST_GROUP_ID,
    removedUsers = [TEST_PARTICIPANT_ID],
    initiatorId = '972501234567@c.us',
    initiatorName = 'Test User',
  }: {
    groupId?: string;
    removedUsers?: string[];
    initiatorId?: string;
    initiatorName?: string;
  } = {}): GroupLeftEvent {
    return {
      eventType: GroupEventType.GROUP_LEFT,
      timestamp: new Date(),
      groupId,
      initiatorId,
      initiatorName,
      removedUsers,
      metadata: {},
    };
  }

  /**
   * Create a test group in the database
   */
  static createTestGroup(
    prisma: any,
    overrides: Partial<Group> = {}
  ): Promise<Group> {
    return prisma.group.create({
      data: {
        name: overrides.name || 'Existing Test Group',
        description: overrides.description || 'A group that already exists',
        whatsappGroupId: overrides.whatsappGroupId || TEST_GROUP_ID,
        status: overrides.status || 'active',
      },
    });
  }
}
