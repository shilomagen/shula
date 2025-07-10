import { MessageReactionEventType } from '../constants/event-types';

/**
 * Base interface for all message reaction events
 */
export interface BaseMessageReactionEvent {
  /**
   * Type of the message reaction event
   */
  eventType: MessageReactionEventType;

  /**
   * Timestamp when the event occurred
   */
  timestamp: Date | number;

  /**
   * Correlation ID for tracing events through the system
   */
  correlationId: string;
}

/**
 * Interface representing a message ID from WhatsApp
 */
export interface MessageId {
  /**
   * Whether the message was sent by the bot
   */
  fromMe: boolean;

  /**
   * The chat ID where the message was sent
   */
  remote: string;

  /**
   * The message ID
   */
  id: string;

  /**
   * The serialized message ID
   */
  _serialized: string;

  /**
   * The participant ID who sent the message
   */
  participant?: string;
}

/**
 * Interface for message reaction added events
 */
export interface MessageReactionAddedEvent extends BaseMessageReactionEvent {
  /**
   * Type of the event - must be MESSAGE_REACTION_ADDED
   */
  eventType: MessageReactionEventType.MESSAGE_REACTION_ADDED;

  /**
   * The message ID object
   */
  id: MessageId;

  /**
   * Unix timestamp when the reaction was created
   */
  timestamp: number;

  /**
   * The reaction emoji
   */
  reaction: string;

  /**
   * Whether the reaction has been read
   */
  read: boolean;

  /**
   * The message ID that was reacted to
   */
  msgId: MessageId;

  /**
   * The WhatsApp ID of the user who reacted
   */
  senderId: string;

  /**
   * The group ID where the reaction occurred
   */
  remote: string;

  /**
   * Acknowledgement status
   */
  ack?: number;

  /**
   * Orphan status
   */
  orphan?: number;

  /**
   * Orphan reason
   */
  orphanReason?: string;
}

/**
 * Interface for message reaction removed events
 */
export interface MessageReactionRemovedEvent extends BaseMessageReactionEvent {
  /**
   * Type of the event - must be MESSAGE_REACTION_REMOVED
   */
  eventType: MessageReactionEventType.MESSAGE_REACTION_REMOVED;

  /**
   * The message ID object
   */
  id: MessageId;

  /**
   * Unix timestamp when the reaction was removed
   */
  timestamp: number;

  /**
   * The reaction emoji (empty string when removed)
   */
  reaction: string;

  /**
   * Whether the reaction has been read
   */
  read: boolean;

  /**
   * The message ID that was reacted to
   */
  msgId: MessageId;

  /**
   * The WhatsApp ID of the user who removed the reaction
   */
  senderId: string;

  /**
   * The group ID where the reaction occurred
   */
  remote: string;

  /**
   * Acknowledgement status
   */
  ack?: number;

  /**
   * Orphan status
   */
  orphan?: number;

  /**
   * Orphan reason
   */
  orphanReason?: string;
}

/**
 * Union type for all message reaction events
 */
export type MessageReactionEvent =
  | MessageReactionAddedEvent
  | MessageReactionRemovedEvent;
