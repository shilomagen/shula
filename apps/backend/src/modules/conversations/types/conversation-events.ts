import { MessageType } from '../../../common/enums/domain.enums';

export interface BaseConversationResponse {
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentMessageResponse extends BaseConversationResponse {
  type: MessageType.AGENT_MESSAGE;
  content: string;
}

export interface CreatePersonResponse extends BaseConversationResponse {
  type: MessageType.PERSON_CREATED;
  name: string;
  imageIds: string[];
  personId?: string;
}

export interface ConnectPersonResponse extends BaseConversationResponse {
  type: MessageType.PERSON_CONNECTED;
  personId: string;
  groupIds: string[];
}

export interface ImageUploadResponse extends BaseConversationResponse {
  type: MessageType.IMAGE_UPLOAD;
  imageId: string;
}

export interface SystemEventResponse extends BaseConversationResponse {
  type: MessageType.SYSTEM_EVENT;
  message: string;
}

export type ConversationResponse =
  | AgentMessageResponse
  | CreatePersonResponse
  | ConnectPersonResponse
  | ImageUploadResponse
  | SystemEventResponse;

// Type guard to ensure the type is a valid MessageType
export function isValidMessageType(type: string): type is MessageType {
  return Object.values(MessageType).includes(type as MessageType);
}
