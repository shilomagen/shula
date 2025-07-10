import { EscalationActionHandlerTestDriver } from './escalation.handler.driver';
import { EscalationActionFixture } from './fixtures/escalation.fixture';
import { ActionType } from '../../actions/actions';

describe('EscalationActionHandler', () => {
  const driver = EscalationActionHandlerTestDriver();
  const participantId = 'participant-123';
  const defaultGroupId = '120363414616640549@g.us';

  beforeEach(async () => {
    await driver.init();
  });

  afterEach(async () => {
    await driver.cleanup();
  });

  describe('canHandle', () => {
    it('should return true for escalation actions', () => {
      // Arrange
      const action = EscalationActionFixture.valid();

      // Act
      const result = driver.when.canHandle(action);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for non-escalation actions', () => {
      // Arrange
      const action = {
        action: ActionType.CONNECT_PERSON,
        successMessage: 'Success',
        errorMessage: 'Error',
      };

      // Act
      const result = driver.when.canHandle(action);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('execute', () => {
    it('should send a message to the specified group when escalation arrives', async () => {
      // Arrange
      const groupId = defaultGroupId;
      const issue = 'Critical system failure';
      const priority = 'high';

      const action = EscalationActionFixture.withIssueAndPriority(
        issue,
        priority
      );

      driver.given.successfulGroupMessageSend();

      // Act
      const result = await driver.when.executeHandler(action, participantId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Issue has been escalated successfully');
      expect(result.data).toMatchObject({
        issue,
        priority,
        groupId,
        escalatedAt: expect.any(String),
      });

      // Verify the message was sent to the group
      expect(driver.get.sendGroupMessageCallCount()).toBe(1);

      const [sentGroupId, sentMessage, sentMedia, sentMetadata] =
        driver.get.sendGroupMessageArgs();
      expect(sentGroupId).toBe(groupId);
      expect(sentMessage).toContain('ESCALATION');
      expect(sentMessage).toContain(issue);
      expect(sentMessage).toContain(priority);
      expect(sentMessage).toContain(participantId);
      expect(sentMedia).toBeUndefined();
      expect(sentMetadata).toMatchObject({
        type: 'ESCALATION',
        sourceId: participantId,
        additionalData: {
          issue,
          priority,
          escalatedAt: expect.any(String),
        },
      });
    });

    it('should use default group ID when not provided', async () => {
      // Arrange
      const issue = 'System warning';
      const priority = 'medium';

      // Create action without specifying group ID
      const action = EscalationActionFixture.valid({
        content: {
          issue,
          priority,
        },
      });

      driver.given.successfulGroupMessageSend();

      // Act
      const result = await driver.when.executeHandler(action, participantId);

      // Assert
      expect(result.success).toBe(true);

      // Verify the message was sent to the default group
      const [sentGroupId] = driver.get.sendGroupMessageArgs();
      expect(sentGroupId).toBe(defaultGroupId);
    });

    it('should return failure result when sending message fails', async () => {
      // Arrange
      const error = new Error('Failed to send message');
      const action = EscalationActionFixture.valid();

      driver.given.failedGroupMessageSend(error);

      // Act
      const result = await driver.when.executeHandler(action, participantId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to escalate issue');
      expect(result.data).toMatchObject({
        error: error.message,
      });
    });
  });
});
