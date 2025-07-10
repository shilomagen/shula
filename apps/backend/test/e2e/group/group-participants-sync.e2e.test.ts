import {
  ConsentResponseType,
  EntityStatus,
  Group,
  GroupParticipant,
  Participant,
} from '@prisma/client';
import { GroupEvent, GroupEventType, QUEUE_NAMES } from '@shula/shared-queues';
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
 * Properly format WhatsApp ID to phone number
 */
function formatWhatsAppId(id: string): string {
  // If it contains @c.us, extract the phone number part
  if (id.includes('@c.us')) {
    const phoneNumber = id.split('@')[0];
    return formatPhoneNumber(phoneNumber);
  }
  return id;
}

/**
 * Extended base test with queue support for group participants sync events testing
 */
class GroupParticipantsSyncTest extends BaseTest {
  protected groupManagementQueue!: Queue<GroupEvent>;
  protected participantOperationsQueue!: Queue;
  protected groupsApi!: GroupsApi;
  protected participantsApi!: ParticipantsApi;

  override async setup(): Promise<void> {
    await super.setup();
    // Get the queues from the module
    this.groupManagementQueue = this.moduleRef.get<Queue<GroupEvent>>(
      `BullQueue_${QUEUE_NAMES.GROUP_MANAGEMENT}`
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
      this.participantOperationsQueue,
    ]);
  }

  /**
   * Check if participant removal is queued
   */
  async verifyParticipantRemovalQueued(): Promise<boolean> {
    return hasJobsInQueue(this.participantOperationsQueue);
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
   * Find a participant by phone number
   */
  async findParticipantByPhoneNumber(
    phoneNumber: string
  ): Promise<Participant | null> {
    // Ensure proper formatting
    const formattedNumber = formatPhoneNumber(phoneNumber);
    return this.prisma.participant.findFirst({
      where: { phoneNumber: formattedNumber },
      include: {
        groups: true,
      },
    });
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

  /**
   * Get participant consent from database
   */
  async findParticipantConsent(participantId: string, groupId: string) {
    return this.prisma.participantConsent.findFirst({
      where: {
        participantId,
        groupId,
      },
    });
  }

  /**
   * Find group by WhatsApp ID
   */
  async findGroupByWhatsAppId(whatsappGroupId: string) {
    return this.prisma.group.findFirst({
      where: { whatsappGroupId },
    });
  }

  /**
   * Create a participants sync event
   */
  createParticipantsSyncEvent(
    groupId = TEST_GROUP_ID,
    groupName = 'Test Group',
    participants: Array<{ id: string; name?: string; isAdmin?: boolean }> = []
  ) {
    // Make sure all IDs are in WhatsApp format (have @c.us)
    const formattedParticipants = participants.map((p) => ({
      ...p,
      id: p.id.includes('@c.us') ? p.id : `${p.id.replace('+', '')}@c.us`,
    }));

    return {
      eventType: GroupEventType.GROUP_PARTICIPANTS_SYNC,
      groupId,
      groupName,
      participants: formattedParticipants,
      timestamp: new Date(),
      metadata: {
        participantCount: formattedParticipants.length,
      },
    } as const;
  }
}

describe('Group Participants Sync Events (e2e)', () => {
  const baseTest = new GroupParticipantsSyncTest();
  let testGroup: Group;

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

  describe('Adding new participants', () => {
    beforeEach(async () => {
      // Create a test group before each test
      testGroup = await baseTest.createTestData(async (prisma) => {
        return await GroupEventFixture.createTestGroup(prisma, {
          name: 'Sync Test Group',
        });
      });
    });

    it('should add new participants to the group when they appear in WhatsApp', async () => {
      // Create a sync event with new participants
      const participantPhoneNumber1 = '+972501234567';
      const participantPhoneNumber2 = '+972501234568';

      const syncEvent = baseTest.createParticipantsSyncEvent(
        testGroup.whatsappGroupId,
        testGroup.name,
        [
          {
            id: participantPhoneNumber1,
            name: 'Test User 1',
            isAdmin: false,
          },
          {
            id: participantPhoneNumber2,
            name: 'Test User 2',
            isAdmin: true,
          },
        ]
      );

      // Publish the event to the queue
      await baseTest.publishGroupEvent(syncEvent);

      // Wait for participants to be added to the group
      const participantsAdded = await waitForCondition(async () => {
        const participant1 = await baseTest.findParticipantByPhoneNumber(
          participantPhoneNumber1
        );
        const participant2 = await baseTest.findParticipantByPhoneNumber(
          participantPhoneNumber2
        );

        return participant1 !== null && participant2 !== null;
      }, 10000); // Extend timeout to 10 seconds

      expect(participantsAdded).toBe(true);

      // Verify participants are in the group
      const participant1 = await baseTest.findParticipantByPhoneNumber(
        participantPhoneNumber1
      );
      const participant2 = await baseTest.findParticipantByPhoneNumber(
        participantPhoneNumber2
      );

      expect(participant1).not.toBeNull();
      expect(participant2).not.toBeNull();

      const participant1InGroup = await baseTest.participantExistsInGroup(
        participant1!.id,
        testGroup.id
      );
      const participant2InGroup = await baseTest.participantExistsInGroup(
        participant2!.id,
        testGroup.id
      );

      expect(participant1InGroup).toBe(true);
      expect(participant2InGroup).toBe(true);

      // Wait a bit for consent records to be created
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check that consent records were created
      const consent1 = await baseTest.findParticipantConsent(
        participant1!.id,
        testGroup.id
      );

      const consent2 = await baseTest.findParticipantConsent(
        participant2!.id,
        testGroup.id
      );

      expect(consent1).not.toBeNull();
      expect(consent2).not.toBeNull();
      expect(consent1!.consentStatus).toBe(ConsentResponseType.pending);
      expect(consent2!.consentStatus).toBe(ConsentResponseType.pending);
    });

    it('should handle new participants when the group already has participants', async () => {
      // Add an existing participant to the group
      const existingParticipant = await baseTest.createTestData(
        async (prisma) => {
          const participant = await prisma.participant.create({
            data: {
              phoneNumber: '+972501234567',
              name: 'Existing Participant',
              status: EntityStatus.active,
              joinedAt: new Date(),
            },
          });

          await prisma.groupParticipant.create({
            data: {
              groupId: testGroup.id,
              participantId: participant.id,
            },
          });

          return participant;
        }
      );

      // Create a sync event with the existing participant plus a new one
      const newParticipantPhoneNumber = '+972501234568';

      const syncEvent = baseTest.createParticipantsSyncEvent(
        testGroup.whatsappGroupId,
        testGroup.name,
        [
          {
            id: existingParticipant.phoneNumber,
            name: 'Existing Participant',
            isAdmin: false,
          },
          {
            id: newParticipantPhoneNumber,
            name: 'New Participant',
            isAdmin: false,
          },
        ]
      );

      // Publish the event to the queue
      await baseTest.publishGroupEvent(syncEvent);

      // Wait for the new participant to be added
      const newParticipantAdded = await waitForCondition(async () => {
        const participant = await baseTest.findParticipantByPhoneNumber(
          newParticipantPhoneNumber
        );
        return participant !== null;
      }, 10000);

      expect(newParticipantAdded).toBe(true);

      // Verify the new participant is in the group
      const newParticipant = await baseTest.findParticipantByPhoneNumber(
        newParticipantPhoneNumber
      );
      expect(newParticipant).not.toBeNull();

      const newParticipantInGroup = await baseTest.participantExistsInGroup(
        newParticipant!.id,
        testGroup.id
      );
      expect(newParticipantInGroup).toBe(true);

      // Verify the existing participant is still in the group
      const existingParticipantInGroup =
        await baseTest.participantExistsInGroup(
          existingParticipant.id,
          testGroup.id
        );
      expect(existingParticipantInGroup).toBe(true);
    });
  });

  describe('Removing participants', () => {
    let testParticipant1: Participant;
    let testParticipant2: Participant;

    beforeEach(async () => {
      // Create a test group with participants before each test
      const result = await baseTest.createTestData(async (prisma) => {
        const group = await GroupEventFixture.createTestGroup(prisma, {
          name: 'Sync Removal Test Group',
        });

        // Create two participants
        const participant1 = await prisma.participant.create({
          data: {
            phoneNumber: '+972501234567',
            name: 'Test Participant 1',
            status: EntityStatus.active,
            joinedAt: new Date(),
          },
        });

        const participant2 = await prisma.participant.create({
          data: {
            phoneNumber: '+972501234568',
            name: 'Test Participant 2',
            status: EntityStatus.active,
            joinedAt: new Date(),
          },
        });

        // Add both participants to the group
        await prisma.groupParticipant.create({
          data: {
            groupId: group.id,
            participantId: participant1.id,
          },
        });

        await prisma.groupParticipant.create({
          data: {
            groupId: group.id,
            participantId: participant2.id,
          },
        });

        // Create consent records
        await prisma.participantConsent.createMany({
          data: [
            {
              groupId: group.id,
              participantId: participant1.id,
              consentStatus: ConsentResponseType.pending,
            },
            {
              groupId: group.id,
              participantId: participant2.id,
              consentStatus: ConsentResponseType.pending,
            },
          ],
        });

        return { group, participant1, participant2 };
      });

      testGroup = result.group;
      testParticipant1 = result.participant1;
      testParticipant2 = result.participant2;
    });

    it('should remove participants that are no longer in the WhatsApp group', async () => {
      // Create a sync event with only one of the participants
      const syncEvent = baseTest.createParticipantsSyncEvent(
        testGroup.whatsappGroupId,
        testGroup.name,
        [
          {
            id: testParticipant1.phoneNumber,
            name: 'Test Participant 1',
            isAdmin: false,
          },
        ]
      );

      // Publish the event to the queue
      await baseTest.publishGroupEvent(syncEvent);

      // Wait for the participant to be removed from the group
      const participantRemoved = await waitForCondition(async () => {
        return !(await baseTest.participantExistsInGroup(
          testParticipant2.id,
          testGroup.id
        ));
      });

      expect(participantRemoved).toBe(true);

      // Verify the first participant is still in the group
      const participant1InGroup = await baseTest.participantExistsInGroup(
        testParticipant1.id,
        testGroup.id
      );
      expect(participant1InGroup).toBe(true);
    });

    it('should delete participants when they no longer belong to any group', async () => {
      // Create a sync event with an empty participants list
      const syncEvent = baseTest.createParticipantsSyncEvent(
        testGroup.whatsappGroupId,
        testGroup.name,
        [] // No participants in the group
      );

      // Publish the event to the queue
      await baseTest.publishGroupEvent(syncEvent);

      // Wait for participants to be removed from the group and deleted
      const participantsRemoved = await waitForCondition(async () => {
        const participant1 = await baseTest.findParticipant(
          testParticipant1.id
        );
        const participant2 = await baseTest.findParticipant(
          testParticipant2.id
        );

        return participant1 === null && participant2 === null;
      }, 10000);

      expect(participantsRemoved).toBe(true);
    });

    it('should keep participant when they still belong to another group', async () => {
      // Create another group for the first participant
      const anotherGroup = await baseTest.createTestData(async (prisma) => {
        const group = await GroupEventFixture.createTestGroup(prisma, {
          name: 'Second Group',
          whatsappGroupId: 'another-group-123@g.us',
        });

        // Add only the first participant to this group
        await prisma.groupParticipant.create({
          data: {
            groupId: group.id,
            participantId: testParticipant1.id,
          },
        });

        return group;
      });

      // Create a sync event with no participants in the first group
      const syncEvent = baseTest.createParticipantsSyncEvent(
        testGroup.whatsappGroupId,
        testGroup.name,
        [] // No participants in the group
      );

      // Publish the event to the queue
      await baseTest.publishGroupEvent(syncEvent);

      // Wait for participants to be removed from the original group
      const participantsRemovedFromGroup = await waitForCondition(async () => {
        const p1InOriginalGroup = await baseTest.participantExistsInGroup(
          testParticipant1.id,
          testGroup.id
        );
        const p2InOriginalGroup = await baseTest.participantExistsInGroup(
          testParticipant2.id,
          testGroup.id
        );

        return !p1InOriginalGroup && !p2InOriginalGroup;
      }, 10000);

      expect(participantsRemovedFromGroup).toBe(true);

      // Verify first participant is still in the second group and exists
      const p1StillInSecondGroup = await baseTest.participantExistsInGroup(
        testParticipant1.id,
        anotherGroup.id
      );
      const p1 = await baseTest.findParticipant(testParticipant1.id);

      expect(p1StillInSecondGroup).toBe(true);
      expect(p1).not.toBeNull();

      // Verify second participant was deleted
      const p2 = await baseTest.findParticipant(testParticipant2.id);
      expect(p2).toBeNull();
    });
  });

  describe('Group creation and sync', () => {
    it('should create a new group if it does not exist', async () => {
      const newGroupId = 'new-group-123@g.us';
      const newGroupName = 'New Sync Group';

      // Create a sync event for a non-existent group
      const syncEvent = baseTest.createParticipantsSyncEvent(
        newGroupId,
        newGroupName,
        [
          {
            id: '+972501234567',
            name: 'Test User 1',
            isAdmin: false,
          },
        ]
      );

      // Publish the event to the queue
      await baseTest.publishGroupEvent(syncEvent);

      // Wait for the group to be created
      const groupCreated = await waitForCondition(async () => {
        const group = await baseTest.findGroupByWhatsAppId(newGroupId);
        return group !== null;
      }, 10000);

      expect(groupCreated).toBe(true);

      // Verify the group has the correct name
      const createdGroup = await baseTest.findGroupByWhatsAppId(newGroupId);

      expect(createdGroup).not.toBeNull();
      expect(createdGroup!.name).toBe(newGroupName);

      // Verify the participant was added to the group
      const participant = await baseTest.findParticipantByPhoneNumber(
        '+972501234567'
      );

      expect(participant).not.toBeNull();

      const participantInGroup = await baseTest.participantExistsInGroup(
        participant!.id,
        createdGroup!.id
      );

      expect(participantInGroup).toBe(true);
    });
  });

  describe('Complex sync scenarios', () => {
    it('should correctly handle adding and removing participants in the same sync', async () => {
      // Create initial group with two participants
      const result = await baseTest.createTestData(async (prisma) => {
        const group = await GroupEventFixture.createTestGroup(prisma, {
          name: 'Complex Sync Test Group',
        });

        // Create two participants
        const participant1 = await prisma.participant.create({
          data: {
            phoneNumber: '+972501234567',
            name: 'Initial Participant 1',
            status: EntityStatus.active,
            joinedAt: new Date(),
          },
        });

        const participant2 = await prisma.participant.create({
          data: {
            phoneNumber: '+972501234568',
            name: 'Initial Participant 2',
            status: EntityStatus.active,
            joinedAt: new Date(),
          },
        });

        // Add both participants to the group
        await prisma.groupParticipant.createMany({
          data: [
            { groupId: group.id, participantId: participant1.id },
            { groupId: group.id, participantId: participant2.id },
          ],
        });

        return { group, participant1, participant2 };
      });

      const testGroup = result.group;
      const initialParticipant1 = result.participant1;
      const initialParticipant2 = result.participant2;

      // Create a sync event that removes participant2 and adds a new participant3
      const newParticipantNumber = '+972501234569';

      const syncEvent = baseTest.createParticipantsSyncEvent(
        testGroup.whatsappGroupId,
        testGroup.name,
        [
          // Keep participant1
          {
            id: initialParticipant1.phoneNumber,
            name: 'Initial Participant 1',
            isAdmin: false,
          },
          // Add new participant3
          {
            id: newParticipantNumber,
            name: 'New Participant 3',
            isAdmin: true,
          },
          // participant2 is not included (will be removed)
        ]
      );

      // Publish the event to the queue
      await baseTest.publishGroupEvent(syncEvent);

      // Wait for changes to be applied
      const changesApplied = await waitForCondition(async () => {
        // Check if participant2 is removed
        const p2Removed = !(await baseTest.participantExistsInGroup(
          initialParticipant2.id,
          testGroup.id
        ));

        // Check if new participant is added
        const newParticipant = await baseTest.findParticipantByPhoneNumber(
          newParticipantNumber
        );
        const newParticipantAdded =
          newParticipant !== null &&
          (await baseTest.participantExistsInGroup(
            newParticipant.id,
            testGroup.id
          ));

        // Both conditions must be true
        return p2Removed && newParticipantAdded;
      }, 10000);

      expect(changesApplied).toBe(true);

      // Verify participant1 is still in the group
      const p1StillInGroup = await baseTest.participantExistsInGroup(
        initialParticipant1.id,
        testGroup.id
      );
      expect(p1StillInGroup).toBe(true);
    });
  });
});
