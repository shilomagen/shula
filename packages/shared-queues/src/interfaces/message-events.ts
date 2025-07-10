import { MessageEventType } from '../constants/event-types';

/**
 * Base interface for all message events
 */
export interface BaseMessageEvent {
  /**
   * Type of the message event
   */
  eventType: MessageEventType;

  /**
   * Timestamp when the event occurred
   */
  timestamp: Date;

  /**
   * Correlation ID for tracing events through the system
   */
  correlationId: string;
}

/**
 * Media types that can be attached to a message
 */
export enum MessageMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  STICKER = 'sticker',
  LOCATION = 'location',
  CONTACT = 'contact',
}

/**
 * Message status values
 */
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

/**
 * Base media information interface
 */
export interface BaseMessageMedia {
  /**
   * Type of media
   */
  mediaType: MessageMediaType;

  /**
   * MIME type of the media
   */
  mimetype?: string;

  /**
   * Filename for the media (if applicable)
   */
  filename?: string;

  /**
   * Size of the media in bytes
   */
  size?: number;
}

/**
 * Image media information
 */
export interface ImageMessageMedia extends BaseMessageMedia {
  /**
   * Type of media - must be IMAGE
   */
  mediaType: MessageMediaType.IMAGE;

  /**
   * Base64 encoded image data
   */
  base64Data?: string;

  /**
   * URL to the image
   */
  mediaUrl?: string;
}

/**
 * Video media information
 */
export interface VideoMessageMedia extends BaseMessageMedia {
  /**
   * Type of media - must be VIDEO
   */
  mediaType: MessageMediaType.VIDEO;

  /**
   * URL to the video
   */
  mediaUrl?: string;
}

/**
 * Audio media information
 */
export interface AudioMessageMedia extends BaseMessageMedia {
  /**
   * Type of media - must be AUDIO
   */
  mediaType: MessageMediaType.AUDIO;

  /**
   * URL to the audio
   */
  mediaUrl?: string;
}

/**
 * Document media information
 */
export interface DocumentMessageMedia extends BaseMessageMedia {
  /**
   * Type of media - must be DOCUMENT
   */
  mediaType: MessageMediaType.DOCUMENT;

  /**
   * URL to the document
   */
  mediaUrl?: string;
}

/**
 * Sticker media information
 */
export interface StickerMessageMedia extends BaseMessageMedia {
  /**
   * Type of media - must be STICKER
   */
  mediaType: MessageMediaType.STICKER;

  /**
   * URL to the sticker
   */
  mediaUrl?: string;
}

/**
 * Location media information
 */
export interface LocationMessageMedia extends BaseMessageMedia {
  /**
   * Type of media - must be LOCATION
   */
  mediaType: MessageMediaType.LOCATION;

  /**
   * Location data
   */
  location?: {
    latitude: number;
    longitude: number;
    description?: string;
  };
}

/**
 * Contact media information
 */
export interface ContactMessageMedia extends BaseMessageMedia {
  /**
   * Type of media - must be CONTACT
   */
  mediaType: MessageMediaType.CONTACT;

  /**
   * Contact data
   */
  contacts?: Array<{
    name: string;
    phoneNumber: string;
  }>;
}

/**
 * Union type for all media types
 */
export type MessageMedia =
  | ImageMessageMedia
  | VideoMessageMedia
  | AudioMessageMedia
  | DocumentMessageMedia
  | StickerMessageMedia
  | LocationMessageMedia
  | ContactMessageMedia;

/**
 * Event payload when a message is received from a participant
 */
export interface MessageReceivedEvent extends BaseMessageEvent {
  /**
   * Type of the event - must be MESSAGE_RECEIVED
   */
  eventType: MessageEventType.MESSAGE_RECEIVED;

  /**
   * WhatsApp message ID
   */
  messageId: string;

  /**
   * ID of the chat where the message was received
   */
  chatId: string;

  /**
   * Whether the chat is a group chat
   */
  isGroupChat: boolean;

  /**
   * ID of the participant who sent the message
   */
  participantId: string;

  /**
   * Name of the participant who sent the message
   */
  participantName?: string;

  /**
   * Phone number of the participant
   */
  phoneNumber: string;

  /**
   * Text content of the message
   */
  content: string;

  /**
   * Media attached to the message (if any)
   */
  media?: MessageMedia;

  /**
   * When the message was sent by the participant
   */
  timestamp: Date;

  /**
   * Additional WhatsApp-specific metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Event payload when a message status changes
 */
export interface MessageStatusChangedEvent extends BaseMessageEvent {
  /**
   * Type of the event - must be MESSAGE_STATUS_CHANGED
   */
  eventType: MessageEventType.MESSAGE_STATUS_CHANGED;

  /**
   * WhatsApp message ID
   */
  messageId: string;

  /**
   * ID of the chat where the message was sent
   */
  chatId: string;

  /**
   * ID of the participant who received the message
   */
  participantId: string;

  /**
   * New status of the message
   */
  status: MessageStatus;

  /**
   * When the status changed
   */
  timestamp: Date;

  /**
   * Additional WhatsApp-specific metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Job data for delayed response processing
 */
export interface DelayedResponseJobData {
  /**
   * ID of the participant who sent the message
   */
  participantId: string;

  /**
   * ID of the message to respond to
   */
  messageId: string;

  /**
   * Content of the message
   */
  content: string;
}

/**
 * Union type of all message events
 */
export type MessageEvent = MessageReceivedEvent | MessageStatusChangedEvent;
