import { GroupEventType } from '../constants/event-types';

/**
 * Base interface for all group events
 */
export interface BaseGroupEvent {
  /**
   * Type of the group event
   */
  eventType: GroupEventType;

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
 * Event payload when participants join a WhatsApp group
 */
export interface GroupJoinedEvent extends BaseGroupEvent {
  /**
   * Type of the event - must be GROUP_JOINED
   */
  eventType: GroupEventType.GROUP_JOINED;

  /**
   * WhatsApp group ID
   */
  groupId: string;

  /**
   * Name of the WhatsApp group
   */
  groupName?: string;

  /**
   * ID of the user who initiated the action
   */
  initiatorId?: string;

  /**
   * Name of the user who initiated the action
   */
  initiatorName?: string;

  /**
   * Whether the group is read-only
   */
  isReadOnly: boolean;

  /**
   * List of participants in the group
   */
  participants?: {
    /**
     * Participant's WhatsApp ID
     */
    id: string;

    /**
     * Participant's name if available
     */
    name?: string;

    /**
     * Whether the participant is an admin in the group
     */
    isAdmin?: boolean;
  }[];

  /**
   * IDs of the users added to the group in this event
   */
  addedUsers: string[];

  /**
   * Additional WhatsApp-specific metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Event payload when participants leave a WhatsApp group
 */
export interface GroupLeftEvent extends BaseGroupEvent {
  /**
   * Type of the event - must be GROUP_LEFT
   */
  eventType: GroupEventType.GROUP_LEFT;

  /**
   * WhatsApp group ID
   */
  groupId: string;

  /**
   * ID of the user who initiated the action, if available
   */
  initiatorId?: string;

  /**
   * Name of the user who initiated the action, if available
   */
  initiatorName?: string;

  /**
   * IDs of the users removed from the group in this event
   */
  removedUsers: string[];

  /**
   * Additional WhatsApp-specific metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Event payload when admin status changes in a WhatsApp group
 */
export interface GroupAdminChangedEvent extends BaseGroupEvent {
  /**
   * Type of the event - must be GROUP_ADMIN_CHANGED
   */
  eventType: GroupEventType.GROUP_ADMIN_CHANGED;

  /**
   * WhatsApp group ID
   */
  groupId: string;

  /**
   * ID of the participant whose admin status changed
   */
  participantId: string;

  /**
   * Whether the participant is now an admin
   */
  isNowAdmin: boolean;

  /**
   * Additional WhatsApp-specific metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Event payload for syncing group participants
 */
export interface GroupParticipantsSyncEvent extends BaseGroupEvent {
  /**
   * Type of the event - must be GROUP_PARTICIPANTS_SYNC
   */
  eventType: GroupEventType.GROUP_PARTICIPANTS_SYNC;

  /**
   * WhatsApp group ID
   */
  groupId: string;

  /**
   * Name of the WhatsApp group
   */
  groupName?: string;

  /**
   * List of all current participants in the group
   */
  participants: {
    /**
     * Participant's WhatsApp ID
     */
    id: string;

    /**
     * Participant's name if available
     */
    name?: string;

    /**
     * Whether the participant is an admin in the group
     */
    isAdmin?: boolean;
  }[];

  /**
   * Additional WhatsApp-specific metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Union type of all group events
 */
export type GroupEvent =
  | GroupJoinedEvent
  | GroupLeftEvent
  | GroupAdminChangedEvent
  | GroupParticipantsSyncEvent;
