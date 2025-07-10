import { Injectable } from '@nestjs/common';
import { ContextLogger } from 'nestjs-context-logger';
import { ActionType, BaseAction } from '../actions/actions';
import { ActionHandler, ActionResult } from './action-handler.interface';

@Injectable()
export class ActionRegistryService {
  private readonly logger = new ContextLogger(ActionRegistryService.name);
  private readonly handlers = new Map<ActionType, ActionHandler<any>>();

  registerHandler(type: ActionType, handler: ActionHandler<any>): void {
    this.handlers.set(type, handler);
  }

  async executeAction(
    action: BaseAction,
    participantId: string
  ): Promise<ActionResult> {
    // Identify action type and find appropriate handler
    const actionType = (action as any).action;
    const handler = this.handlers.get(actionType);

    if (!handler) {
      return {
        success: false,
        message: `No handler registered for action type: ${actionType}`,
      };
    }

    try {
      return await handler.execute(action, participantId);
    } catch (error: any) {
      this.logger.error(`Error executing action ${actionType}:`, { error });
      return {
        success: false,
        message: action.errorMessage || 'Action failed to execute',
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}
