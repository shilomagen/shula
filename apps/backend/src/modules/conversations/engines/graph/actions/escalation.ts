import { ActionType, BaseAction } from './actions';

export interface EscalationAction extends BaseAction {
  action: ActionType.ESCALATION;
  content: {
    issue: string;
    priority: string;
  };
}
