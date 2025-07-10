import { ActionType, BaseAction } from './actions';

export interface ConnectPersonAction extends BaseAction {
  action: ActionType.CONNECT_PERSON;
  content: {
    imageIds: string[];
    groupId: string;
    childName: string;
  };
}
