import { ConsentResponseType, Group } from '@prisma/client';
import { GroupEvent, QUEUE_NAMES } from '@shula/shared-queues';
import { Queue } from 'bullmq';
import { formatPhoneNumber } from '../../../src/common/utils/phone-number.utils';
import {
  BOT_PHONE_NUMBER,
  FORMATTED_PARTICIPANT_ID,
  GroupEventFixture,
  TEST_GROUP_ID,
  TEST_PARTICIPANT_ID,
} from '../../fixtures';
import { GroupsApi } from '../../generated-client/api/groups-api';
import { ParticipantConsentsApi } from '../../generated-client/api/participant-consents-api';
import { ParticipantsApi } from '../../generated-client/api/participants-api';
import { Configuration } from '../../generated-client/configuration';
import {
  hasJobsInQueue,
  resetQueues,
  waitForCondition,
} from '../../utils/test-utils';
import { BaseTest } from '../utils/base-test';

/**
 * Extended base test with queue support for group events testing
 */
class GroupEventsTest extends BaseTest {
  protected groupManagementQueue!: Queue<GroupEvent>;
  protected outboundMessageQueue!: Queue;
  protected groupsApi!: GroupsApi;
  protected participantsApi!: ParticipantsApi;
  protected participantConsentsApi!: ParticipantConsentsApi;

  override async setup(): Promise<void> {
    await super.setup();
    // Get the queue from the module
    this.groupManagementQueue = this.moduleRef.get<Queue<GroupEvent>>(
      `BullQueue_${QUEUE_NAMES.GROUP_MANAGEMENT}`
    );
    this.outboundMessageQueue = this.moduleRef.get<Queue>(
      `BullQueue_${QUEUE_NAMES.OUTBOUND_MESSAGE}`
    );

    // Initialize API clients
    const basePath = this.getUrl();
    const config = new Configuration({ basePath });
    this.groupsApi = new GroupsApi(config);
    this.participantsApi = new ParticipantsApi(config);
    this.participantConsentsApi = new ParticipantConsentsApi(config);
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
    await resetQueues([this.groupManagementQueue, this.outboundMessageQueue]);
  }

  /**
   * Check if outbound messages were sent
   */
  async verifyMessageQueued(groupId: string): Promise<boolean> {
    return hasJobsInQueue(this.outboundMessageQueue);
  }

  /**
   * Verify a group was created with the specified WhatsApp group ID
   */
  async verifyGroupCreated(
    whatsappGroupId: string,
    name: string
  ): Promise<boolean> {
    try {
      const response = await this.groupsApi.getAllGroups();
      const groups = response.data.items;
      return groups.some(
        (group) =>
          group.whatsappGroupId === whatsappGroupId && group.name === name
      );
    } catch (error) {
      console.error('Error verifying group creation:', error);
      return false;
    }
  }

  /**
   * Verify a participant was added to the group
   */
  async verifyParticipantAdded(groupId: string): Promise<boolean> {
    try {
      const response = await this.participantsApi.getAllParticipants(groupId);
      return response.data.length > 0;
    } catch (error) {
      console.error('Error verifying participant added:', error);
      return false;
    }
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
   * Get the participant consents API for use in tests
   */
  getParticipantConsentsApi(): ParticipantConsentsApi {
    return this.participantConsentsApi;
  }
}

describe('Group Events (e2e)', () => {
  const baseTest = new GroupEventsTest();

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

  describe('Bot Join Events', () => {
    it('should create a group and add all participants when bot joins', async () => {
      const anotherParticipant = GroupEventFixture.createParticipant(
        '972507654321@c.us',
        'Another Participant'
      );

      const participants = [
        GroupEventFixture.createBotParticipant(),
        GroupEventFixture.createTestParticipant(),
        anotherParticipant,
      ];

      // Create a group join event where the bot is one of the added users
      const joinEvent = GroupEventFixture.createGroupJoinEvent({
        participants,
        groupName: 'Test Group',
      });

      // Publish the event to the queue
      await baseTest.publishGroupEvent(joinEvent);

      // Wait for the group to be created
      const groupCreated = await waitForCondition(() =>
        baseTest.verifyGroupCreated(TEST_GROUP_ID, 'Test Group')
      );
      expect(groupCreated).toBe(true);

      // Get the group from the API
      const response = await baseTest.getGroupsApi().getAllGroups();
      const [group] = response.data.items;

      // Check that we have a group with the correct WhatsApp ID
      expect(group).toMatchObject({
        whatsappGroupId: TEST_GROUP_ID,
        name: 'Test Group',
      });

      const participantsResponse = await baseTest
        .getParticipantsApi()
        .getAllParticipants(group.id);

      expect(participantsResponse.data).toHaveLength(2);
      expect(participantsResponse.data).toContainEqual(
        expect.objectContaining({
          phoneNumber: formatPhoneNumber(participants[1].id),
        })
      );
      expect(participantsResponse.data).toContainEqual(
        expect.objectContaining({
          phoneNumber: formatPhoneNumber(participants[2].id),
        })
      );

      const consentResponse = await baseTest
        .getParticipantConsentsApi()
        .getConsentsByGroupId(group.id);

      // We should have at least one consent record
      expect(consentResponse.data).toHaveLength(2);

      // Wait for messages to be queued
      const messagesQueued = await waitForCondition(() =>
        baseTest.verifyMessageQueued(TEST_GROUP_ID)
      );
      expect(messagesQueued).toBe(true);
    });

    it('should check group consent status after bot joins', async () => {
      const participants = [
        GroupEventFixture.createBotParticipant(),
        GroupEventFixture.createTestParticipant(),
      ];

      // Create a group join event where bot is added
      const joinEvent = GroupEventFixture.createGroupJoinEvent({
        participants,
        groupName: 'Test Consent Group',
      });

      // Publish the event to the queue
      await baseTest.publishGroupEvent(joinEvent);

      // Wait for the group to be created
      const groupCreated = await waitForCondition(() =>
        baseTest.verifyGroupCreated(TEST_GROUP_ID, 'Test Consent Group')
      );
      expect(groupCreated).toBe(true);

      // Get the group from the API
      const response = await baseTest.getGroupsApi().getAllGroups();
      const [group] = response.data.items;

      // Check that we have a group with the correct WhatsApp ID
      expect(group).toMatchObject({
        whatsappGroupId: TEST_GROUP_ID,
        name: 'Test Consent Group',
      });

      // Check the group consent status
      const consentStatusResponse = await baseTest
        .getParticipantConsentsApi()
        .getGroupConsentStatus(group.id);

      expect(consentStatusResponse.data).toMatchObject({
        groupId: group.id,
        isApproved: false,
        status: 'rejected',
      });

      // Check individual participant consent statuses
      const participantsConsentResponse = await baseTest
        .getParticipantConsentsApi()
        .getParticipantsConsentStatus(group.id);

      expect(participantsConsentResponse.data.items).toHaveLength(1);
      expect(participantsConsentResponse.data.items[0]).toMatchObject({
        status: 'pending',
      });

      // Wait for messages to be queued
      const messagesQueued = await waitForCondition(() =>
        baseTest.verifyMessageQueued(TEST_GROUP_ID)
      );
      expect(messagesQueued).toBe(true);
    });
  });

  describe('Participant Join Events', () => {
    let testGroup: Group;

    beforeEach(async () => {
      // Create a test group before each participant join test
      testGroup = await baseTest.createTestData(async (prisma) => {
        return await GroupEventFixture.createTestGroup(prisma);
      });
    });

    it('should add a new participant to an existing group', async () => {
      const newParticipant = GroupEventFixture.createTestParticipant();

      // Create a group join event for a new participant in existing group
      const joinEvent = GroupEventFixture.createGroupJoinEvent({
        groupName: 'Existing Test Group',
        participants: [newParticipant],
        addedUsers: [TEST_PARTICIPANT_ID],
        initiatorName: 'Admin User',
      });

      // Publish the event to the queue
      await baseTest.publishGroupEvent(joinEvent);

      // Wait for the participant to be added
      const participantAdded = await waitForCondition(() =>
        baseTest.verifyParticipantAdded(testGroup.id)
      );
      expect(participantAdded).toBe(true);

      // Get the participants from the API
      const participantsResponse = await baseTest
        .getParticipantsApi()
        .getAllParticipants(testGroup.id);

      // Check that we have a participant with the correct phone number
      expect(participantsResponse.data).toHaveLength(1);
      expect(participantsResponse.data[0]).toMatchObject({
        phoneNumber: FORMATTED_PARTICIPANT_ID,
      });

      // Get the consent records from the API
      const consentResponse = await baseTest
        .getParticipantConsentsApi()
        .getConsentsByGroupId(testGroup.id);

      // Check that we have a consent record for the participant
      expect(consentResponse.data).toHaveLength(1);
      expect(consentResponse.data[0]).toMatchObject({
        participantId: participantsResponse.data[0].id,
        consentStatus: ConsentResponseType.pending,
      });
    });
  });
});
