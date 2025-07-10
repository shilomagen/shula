export enum ActionType {
  CONNECT_PERSON = 'connect_child_to_group_action',
  REMOVE_PERSON = 'remove_person_from_group_action',
  ESCALATION = 'escalation_action',
}

export interface BaseAction {
  action: ActionType;
  successMessage: string;
  errorMessage: string;
}
