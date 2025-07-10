import { BaseAction } from '../actions/actions';

export interface ActionResult {
  success: boolean;
  message: string;
  data?: Record<string, any>;
}

export interface ActionHandler<T extends BaseAction> {
  canHandle(action: BaseAction): boolean;
  execute(action: T, participantId: string): Promise<ActionResult>;
}
