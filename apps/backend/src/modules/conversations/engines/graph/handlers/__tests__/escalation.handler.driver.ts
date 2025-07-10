import { jest } from '@jest/globals';
import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { OutboundMessageService } from '../../../../../outbound-messages/services/outbound-message.service';
import { BaseAction } from '../../actions/actions';
import { EscalationAction } from '../../actions/escalation';
import { ActionResult } from '../action-handler.interface';
import { EscalationActionHandler } from '../escalation.handler';

/**
 * Test driver for the EscalationActionHandler
 * Follows the driver pattern with given/when/get methods
 */
export function EscalationActionHandlerTestDriver() {
  // Mock services
  const mockOutboundMessageService = mock<OutboundMessageService>();
  // Mock logger to prevent noise in tests
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);

  // Handler instance
  let handler: EscalationActionHandler;

  const init = async (): Promise<void> => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationActionHandler,
        {
          provide: OutboundMessageService,
          useValue: mockOutboundMessageService,
        },
      ],
    }).compile();

    handler = moduleFixture.get<EscalationActionHandler>(
      EscalationActionHandler
    );
  };

  const cleanup = async (): Promise<void> => {
    jest.clearAllMocks();
  };

  const given = {
    /**
     * Setup the outbound message service to successfully send a group message
     */
    successfulGroupMessageSend: () => {
      mockOutboundMessageService.sendGroupMessage.mockResolvedValue();
      return given;
    },

    /**
     * Setup the outbound message service to fail when sending a group message
     */
    failedGroupMessageSend: (error: Error) => {
      mockOutboundMessageService.sendGroupMessage.mockRejectedValue(error);
      return given;
    },
  };

  const when = {
    /**
     * Execute the handler with the given action and participant ID
     */
    executeHandler: (
      action: EscalationAction,
      participantId: string
    ): Promise<ActionResult> => {
      return handler.execute(action, participantId);
    },

    /**
     * Check if the handler can handle the given action
     */
    canHandle: (action: BaseAction): boolean => {
      return handler.canHandle(action);
    },
  };

  const get = {
    /**
     * Get the number of times sendGroupMessage was called
     */
    sendGroupMessageCallCount: (): number => {
      return mockOutboundMessageService.sendGroupMessage.mock.calls.length;
    },

    /**
     * Get the arguments passed to sendGroupMessage
     */
    sendGroupMessageArgs: (callIndex = 0): any => {
      return mockOutboundMessageService.sendGroupMessage.mock.calls[callIndex];
    },
  };

  return {
    init,
    cleanup,
    given,
    when,
    get,
  };
}
