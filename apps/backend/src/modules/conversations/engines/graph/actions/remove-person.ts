import { ActionType, BaseAction } from './actions';

export interface RemovePersonAction extends BaseAction {
  action: ActionType.REMOVE_PERSON;
  content: {
    personId: string;
    groupId: string;
    participantId: string;
  };
}
