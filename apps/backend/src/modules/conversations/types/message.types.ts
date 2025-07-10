import { ConversationMessageType, MessageStatus } from '@prisma/client';

// Base message interface with common properties
export interface BaseMessage {
  id: string;
  conversationId: string;
  timestamp: Date;
  status: MessageStatus;
}

// User message specific properties
export interface UserMessage extends BaseMessage {
  type: typeof ConversationMessageType.USER_MESSAGE;
  content: string;
}

// Agent message specific properties
export interface AgentMessage extends BaseMessage {
  type: typeof ConversationMessageType.AGENT_MESSAGE;
  content: string;
}

// Image upload message specific properties
export interface ImageUploadMessage extends BaseMessage {
  type: typeof ConversationMessageType.IMAGE_UPLOAD;
  photoId: string;
  content?: string; // Optional caption
}

// Person created message specific properties
export interface PersonCreatedMessage extends BaseMessage {
  type: typeof ConversationMessageType.PERSON_CREATED;
  personId: string;
  content?: string;
  metadata: {
    personName: string;
  };
}

// Person connected message specific properties
export interface PersonConnectedMessage extends BaseMessage {
  type: typeof ConversationMessageType.PERSON_CONNECTED;
  personId: string;
  content?: string;
  metadata: {
    personName: string;
    relationship?: string;
  };
}

// System event message specific properties
export interface SystemEventMessage extends BaseMessage {
  type: typeof ConversationMessageType.SYSTEM_EVENT;
  content: string;
  metadata?: Record<string, unknown>;
}

// Union type of all possible message types
export type MessageUnion =
  | UserMessage
  | AgentMessage
  | ImageUploadMessage
  | PersonCreatedMessage
  | PersonConnectedMessage
  | SystemEventMessage;

// Type guard to check if a message is of a specific type
export function isMessageType<T extends MessageUnion>(
  message: MessageUnion,
  type: ConversationMessageType
): message is T {
  return message.type === type;
}

// Discriminated union type for metadata based on message type
export type MessageMetadata<T extends ConversationMessageType> =
  T extends typeof ConversationMessageType.PERSON_CREATED
    ? { personName: string }
    : T extends typeof ConversationMessageType.PERSON_CONNECTED
    ? { personName: string; relationship?: string }
    : T extends typeof ConversationMessageType.SYSTEM_EVENT
    ? Record<string, unknown>
    : never;
