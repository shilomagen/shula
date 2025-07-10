import { ActionType, BaseAction } from '../actions/actions';
import {
  PersonFixture,
  RemovePersonActionFixture,
} from './__tests__/fixtures/remove-person.fixture';
import { RemovePersonActionHandlerTestDriver } from './__tests__/remove-person.handler.driver';

describe('RemovePersonActionHandler', () => {
  let driver: ReturnType<typeof RemovePersonActionHandlerTestDriver>;

  beforeEach(async () => {
    driver = RemovePersonActionHandlerTestDriver();
    await driver.init();
  });

  afterEach(async () => {
    await driver.cleanup();
  });

  describe('canHandle', () => {
    it('should return true for REMOVE_PERSON action', async () => {
      // Arrange
      const action: BaseAction = {
        action: ActionType.REMOVE_PERSON,
        successMessage: 'Success',
        errorMessage: 'Error',
      };

      // Act
      const result = driver.when.canHandleAction(action);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for other actions', async () => {
      // Arrange
      const action: BaseAction = {
        action: ActionType.CONNECT_PERSON,
        successMessage: 'Success',
        errorMessage: 'Error',
      };

      // Act
      const result = driver.when.canHandleAction(action);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('execute', () => {
    const participantId = 'participant-123';
    const personId = 'person-123';
    const groupId = 'group-123';

    it('should successfully remove a person', async () => {
      // Arrange
      const action = RemovePersonActionFixture.withPersonAndGroup(
        personId,
        groupId
      );

      // Set up mocks using the driver
      driver.given.personExists(
        personId,
        participantId,
        groupId,
        PersonFixture.valid({ id: personId })
      );
      driver.given.successfulPersonRemoval();

      // Act
      const result = await driver.when.executeRemovePersonAction(
        action,
        participantId
      );

      // Assert
      expect(result).toEqual({
        success: true,
        message: 'Person removed successfully',
        data: {
          personId,
          groupId,
        },
      });

      // Verify service calls
      expect(
        driver.get.wasFindCalledWith(personId, participantId, groupId)
      ).toBe(true);
      expect(
        driver.get.wasRemovePersonCalledWith(personId, participantId)
      ).toBe(true);
    });

    it('should throw an error when person is not found with the provided identifiers', async () => {
      // Arrange
      const action = RemovePersonActionFixture.withPersonAndGroup(
        personId,
        groupId
      );

      // Set up mocks using the driver
      driver.given.personDoesNotExist(personId, participantId, groupId);

      // Act
      const result = await driver.when.executeRemovePersonAction(
        action,
        participantId
      );

      // Assert
      expect(result).toEqual({
        success: false,
        message: 'Failed to remove person',
        data: {
          error: 'Person not found with the provided identifiers',
        },
      });

      // Verify service calls
      expect(
        driver.get.wasFindCalledWith(personId, participantId, groupId)
      ).toBe(true);
      expect(
        driver.get.wasRemovePersonCalledWith(personId, participantId)
      ).toBe(false);
    });
  });
});
