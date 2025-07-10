import {
  ConsentResponseType,
  EntityStatus,
  Group,
  GroupParticipant,
  Participant,
} from '@prisma/client';
import { GroupEvent, QUEUE_NAMES } from '@shula/shared-queues';
import { Queue } from 'bullmq';
import { formatPhoneNumber } from '../../../src/common/utils/phone-number.utils';
import {
  BOT_PHONE_NUMBER,
  FORMATTED_PARTICIPANT_ID,
  GroupEventFixture,
  ParticipantFixture,
  TEST_GROUP_ID,
  TEST_PARTICIPANT_ID,
} from '../../fixtures';
import { GroupsApi } from '../../generated-client/api/groups-api';
import { ParticipantsApi } from '../../generated-client/api/participants-api';
import { Configuration } from '../../generated-client/configuration';
import {
  hasJobsInQueue,
  resetQueues,
  waitForCondition,
} from '../../utils/test-utils';
import { BaseTest } from '../utils/base-test';

/**
 * Extended base test with queue support for group leave events testing
 */
class GroupLeaveEventsTest extends BaseTest {
  protected groupManagementQueue!: Queue<GroupEvent>;
  protected groupRemovalQueue!: Queue;
  protected participantOperationsQueue!: Queue;
  protected groupsApi!: GroupsApi;
  protected participantsApi!: ParticipantsApi;

  override async setup(): Promise<void> {
    await super.setup();
    // Get the queues from the module
    this.groupManagementQueue = this.moduleRef.get<Queue<GroupEvent>>(
      `BullQueue_${QUEUE_NAMES.GROUP_MANAGEMENT}`
    );

    this.groupRemovalQueue = this.moduleRef.get<Queue>(
      'BullQueue_group-removal' // Using the queue name from QueueName enum
    );

    this.participantOperationsQueue = this.moduleRef.get<Queue>(
      'BullQueue_participant-operations' // Using the queue name from QueueName enum
    );

    // Initialize API clients
    const basePath = this.getUrl();
    const config = new Configuration({ basePath });
    this.groupsApi = new GroupsApi(config);
    this.participantsApi = new ParticipantsApi(config);
  }

  /**
   * Helper to publish a group event to the queue
   */
  async publishGroupEvent(event: GroupEvent): Promise<void> {
    await this.groupManagementQueue.add(event.eventType, event);
  }

  /**
   * Reset all queues after each test
   */
  async resetAllQueues(): Promise<void> {
    await resetQueues([
      this.groupManagementQueue,
      this.groupRemovalQueue,
      this.participantOperationsQueue,
    ]);
  }

  /**
   * Check if group removal is queued
   */
  async verifyGroupRemovalQueued(): Promise<boolean> {
    return hasJobsInQueue(this.groupRemovalQueue);
  }

  /**
   * Check if participant removal is queued
   */
  async verifyParticipantRemovalQueued(): Promise<boolean> {
    return hasJobsInQueue(this.participantOperationsQueue);
  }

  /**
   * Check if a group still exists in the database
   */
  async groupExists(groupId: string): Promise<boolean> {
    try {
      await this.groupsApi.getGroupById(groupId);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a participant exists in a group
   */
  async participantExistsInGroup(
    participantId: string,
    groupId: string
  ): Promise<boolean> {
    try {
      await this.prisma.groupParticipant.findUniqueOrThrow({
        where: {
          groupId_participantId: {
            groupId,
            participantId,
          },
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find a participant by ID
   */
  async findParticipant(participantId: string): Promise<Participant | null> {
    return this.prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        groups: true,
      },
    });
  }

  /**
   * Get the groups API for use in tests
   */
  getGroupsApi(): GroupsApi {
    return this.groupsApi;
  }

  /**
   * Get the participants API for use in tests
   */
  getParticipantsApi(): ParticipantsApi {
    return this.participantsApi;
  }
}

describe('Group Leave Events (e2e)', () => {
  const baseTest = new GroupLeaveEventsTest();
  let testGroup: Group;
  let testParticipants: Participant[];
  let groupParticipants: GroupParticipant[];

  beforeAll(async () => {
    await baseTest.setup();
  });

  afterAll(async () => {
    await baseTest.teardown();
  });

  afterEach(async () => {
    await baseTest.cleanDatabase();
    await baseTest.resetAllQueues();
  });

  describe('Bot Leave Events', () => {
    beforeEach(async () => {
      // Create a test group with multiple participants before each test
      testGroup = await baseTest.createTestData(async (prisma) => {
        const group = await GroupEventFixture.createTestGroup(prisma, {
          name: 'Bot Removal Test Group',
        });

        // Create participants
        testParticipants = [];
        groupParticipants = [];

        // Create 3 participants with required fields
        for (let i = 0; i < 3; i++) {
          const participantData = ParticipantFixture.valid();

          const created = await prisma.participant.create({
            data: {
              phoneNumber: participantData.phoneNumber!,
              name: participantData.name!,
              status: participantData.status || EntityStatus.active,
              joinedAt: new Date(),
            },
          });

          testParticipants.push(created);

          const groupParticipant = await prisma.groupParticipant.create({
            data: {
              groupId: group.id,
              participantId: created.id,
            },
          });

          groupParticipants.push(groupParticipant);
        }

        return group;
      });
    });

    it('should remove participants with no other groups when bot is removed', async () => {
      // Create a second group
      const secondGroup = await baseTest.createTestData(async (prisma) => {
        const group = await GroupEventFixture.createTestGroup(prisma, {
          name: 'Second Test Group',
          whatsappGroupId: 'second-group-123@g.us',
        });

        // Add only the first participant to the second group
        await prisma.groupParticipant.create({
          data: {
            groupId: group.id,
            participantId: testParticipants[0].id,
          },
        });

        return group;
      });

      // Save IDs for later verification
      const participantWithTwoGroups = testParticipants[0].id;
      const participantWithOneGroup = testParticipants[1].id;

      // Create a group leave event where the bot is removed from the first group
      const leaveEvent = GroupEventFixture.createGroupLeaveEvent({
        removedUsers: [BOT_PHONE_NUMBER.replace('+', '') + '@c.us'],
        initiatorName: 'Group Admin',
      });

      // Publish the event to the queue
      await baseTest.publishGroupEvent(leaveEvent);

      // Wait for participant to be deleted
      const participantDeleted = await waitForCondition(async () => {
        const participant = await baseTest.findParticipant(
          participantWithOneGroup
        );
        return participant === null;
      });

      expect(participantDeleted).toBe(true);

      // Verify participant with two groups still exists
      const remainingParticipant = await baseTest.findParticipant(
        participantWithTwoGroups
      );
      expect(remainingParticipant).not.toBeNull();

      // Verify participant is still in the second group
      const stillInSecondGroup = await baseTest.participantExistsInGroup(
        participantWithTwoGroups,
        secondGroup.id
      );
      expect(stillInSecondGroup).toBe(true);
    });
  });

  describe('Participant Leave Events', () => {
    let testParticipant: Participant;

    beforeEach(async () => {
      // Create a test group with a single participant before each test
      testGroup = await baseTest.createTestData(async (prisma) => {
        const group = await GroupEventFixture.createTestGroup(prisma, {
          name: 'Participant Removal Test Group',
        });

        // Create a participant with the test phone number
        testParticipant = await prisma.participant.create({
          data: {
            phoneNumber: FORMATTED_PARTICIPANT_ID,
            name: 'Test Participant',
            status: EntityStatus.active,
            joinedAt: new Date(),
          },
        });

        // Add the participant to the group
        await prisma.groupParticipant.create({
          data: {
            groupId: group.id,
            participantId: testParticipant.id,
          },
        });

        return group;
      });
    });

    it('should handle participant removal from a group', async () => {
      // Create a group leave event where a participant is removed
      const leaveEvent = GroupEventFixture.createGroupLeaveEvent({
        removedUsers: [TEST_PARTICIPANT_ID],
        initiatorName: 'Group Admin',
      });

      // Publish the event to the queue
      await baseTest.publishGroupEvent(leaveEvent);

      // Verify the participant was removed from the group
      const participantRemoved = await waitForCondition(async () => {
        return !(await baseTest.participantExistsInGroup(
          testParticipant.id,
          testGroup.id
        ));
      });

      expect(participantRemoved).toBe(true);
    });

    it('should handle multiple participants removal from a group', async () => {
      // Create another participant
      const anotherParticipant = await baseTest.createTestData(
        async (prisma) => {
          // Create another participant
          const participant = await prisma.participant.create({
            data: {
              phoneNumber: '+972501234567',
              name: 'Another Test Participant',
              status: EntityStatus.active,
              joinedAt: new Date(),
            },
          });

          // Add to the group
          await prisma.groupParticipant.create({
            data: {
              groupId: testGroup.id,
              participantId: participant.id,
            },
          });

          return participant;
        }
      );

      // Create a group leave event where multiple participants are removed
      const leaveEvent = GroupEventFixture.createGroupLeaveEvent({
        removedUsers: [TEST_PARTICIPANT_ID, '972501234567@c.us'],
        initiatorName: 'Group Admin',
      });

      // Publish the event to the queue
      await baseTest.publishGroupEvent(leaveEvent);

      // Verify both participants were removed from the group
      const participantsRemoved = await waitForCondition(async () => {
        const firstParticipantRemoved =
          !(await baseTest.participantExistsInGroup(
            testParticipant.id,
            testGroup.id
          ));

        const secondParticipantRemoved =
          !(await baseTest.participantExistsInGroup(
            anotherParticipant.id,
            testGroup.id
          ));

        return firstParticipantRemoved && secondParticipantRemoved;
      });

      expect(participantsRemoved).toBe(true);
    });

    it('should keep participant when they still belong to another group', async () => {
      // Create another group for the same participant
      const anotherGroup = await baseTest.createTestData(async (prisma) => {
        const group = await GroupEventFixture.createTestGroup(prisma, {
          name: 'Second Group',
          whatsappGroupId: 'another-group-123@g.us',
        });

        // Add the same participant to this group
        await prisma.groupParticipant.create({
          data: {
            groupId: group.id,
            participantId: testParticipant.id,
          },
        });

        return group;
      });

      // Create a group leave event for the first group
      const leaveEvent = GroupEventFixture.createGroupLeaveEvent({
        removedUsers: [TEST_PARTICIPANT_ID],
        initiatorName: 'Group Admin',
      });

      // Publish the event to the queue
      await baseTest.publishGroupEvent(leaveEvent);

      // Verify participant was removed from first group but still exists
      const participantRemovedFromGroup = await waitForCondition(async () => {
        return !(await baseTest.participantExistsInGroup(
          testParticipant.id,
          testGroup.id
        ));
      });

      expect(participantRemovedFromGroup).toBe(true);

      // Verify participant is still in second group
      const stillInSecondGroup = await baseTest.participantExistsInGroup(
        testParticipant.id,
        anotherGroup.id
      );

      expect(stillInSecondGroup).toBe(true);

      // Verify participant still exists in database
      const participant = await baseTest.findParticipant(testParticipant.id);

      expect(participant).not.toBeNull();
    });

    it('should delete participant when they no longer belong to any group', async () => {
      // Create a group leave event for the participant
      const leaveEvent = GroupEventFixture.createGroupLeaveEvent({
        removedUsers: [TEST_PARTICIPANT_ID],
        initiatorName: 'Group Admin',
      });

      // Publish the event to the queue
      await baseTest.publishGroupEvent(leaveEvent);

      // Verify participant was removed from group
      const participantRemovedFromGroup = await waitForCondition(async () => {
        return !(await baseTest.participantExistsInGroup(
          testParticipant.id,
          testGroup.id
        ));
      });

      expect(participantRemovedFromGroup).toBe(true);

      // Since this was the participant's only group, they should be deleted
      const participantDeleted = await waitForCondition(async () => {
        const participant = await baseTest.findParticipant(testParticipant.id);
        return participant === null;
      });

      expect(participantDeleted).toBe(true);
    });
  });
});
