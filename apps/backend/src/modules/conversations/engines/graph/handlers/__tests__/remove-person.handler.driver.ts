import { jest } from '@jest/globals';
import { Logger, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { PersonsService } from '../../../../../persons/persons.service';
import { BaseAction } from '../../actions/actions';
import { RemovePersonAction } from '../../actions/remove-person';
import { ActionResult } from '../action-handler.interface';
import { RemovePersonActionHandler } from '../remove-person.handler';

/**
 * Test driver for the RemovePersonActionHandler
 * Follows the driver pattern with given/when/get methods
 */
export function RemovePersonActionHandlerTestDriver() {
  // Mock services
  const mockPersonsService = mock<PersonsService>();
  // Mock logger to prevent noise in tests
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);

  // Handler instance
  let handler: RemovePersonActionHandler;

  const init = async (): Promise<void> => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        RemovePersonActionHandler,
        { provide: PersonsService, useValue: mockPersonsService },
      ],
    }).compile();

    handler = moduleFixture.get<RemovePersonActionHandler>(
      RemovePersonActionHandler
    );
  };

  const cleanup = async (): Promise<void> => {
    jest.clearAllMocks();
  };

  const given = {
    /**
     * Set up the persons service to return a specific person by identifiers
     */
    personExists: (
      personId: string,
      participantId: string,
      groupId: string,
      personData: any = { name: 'Test Person' }
    ): void => {
      mockPersonsService.find.mockResolvedValue({
        id: personId,
        participantId,
        groupId,
        ...personData,
      });
    },

    /**
     * Set up the persons service to return null for a person lookup by identifiers
     */
    personDoesNotExist: (
      personId: string,
      participantId: string,
      groupId: string
    ): void => {
      mockPersonsService.find.mockResolvedValue(null);
    },

    /**
     * Set up the persons service to successfully remove a person
     */
    successfulPersonRemoval: (): void => {
      mockPersonsService.remove.mockResolvedValue(undefined);
    },

    /**
     * Set up the persons service to fail when removing a person
     */
    failedPersonRemoval: (error: Error): void => {
      mockPersonsService.remove.mockRejectedValue(error);
    },
  };

  const when = {
    /**
     * Execute the remove person action
     */
    executeRemovePersonAction: async (
      action: RemovePersonAction,
      participantId: string
    ): Promise<ActionResult> => {
      return handler.execute(action, participantId);
    },

    /**
     * Test if the handler can handle a specific action
     */
    canHandleAction: (action: BaseAction): boolean => {
      return handler.canHandle(action);
    },
  };

  const get = {
    /**
     * Get the calls made to find
     */
    findCalls: () => mockPersonsService.find.mock.calls,

    /**
     * Get the calls made to remove person
     */
    removePersonCalls: () => mockPersonsService.remove.mock.calls,

    /**
     * Check if find was called with specific identifiers
     */
    wasFindCalledWith: (
      personId: string,
      participantId: string,
      groupId: string
    ): boolean => {
      return mockPersonsService.find.mock.calls.some((call) => {
        const params = call[0];
        return (
          params.personId === personId &&
          params.participantId === participantId &&
          params.groupId === groupId
        );
      });
    },

    /**
     * Check if remove was called with specific person ID and participant ID
     */
    wasRemovePersonCalledWith: (
      personId: string,
      participantId: string
    ): boolean => {
      return mockPersonsService.remove.mock.calls.some(
        (call) => call[0] === personId && call[1] === participantId
      );
    },
  };

  return { init, cleanup, given, when, get };
}
