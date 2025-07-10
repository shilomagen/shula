/**
 * WhatsApp group event types for queue messages
 */
export enum GroupEventType {
  /**
   * Event when a bot joins a WhatsApp group
   */
  GROUP_JOINED = 'group.joined',

  /**
   * Event when a bot leaves a WhatsApp group
   */
  GROUP_LEFT = 'group.left',

  /**
   * Event when a bot's admin status changes
   */
  GROUP_ADMIN_CHANGED = 'group.admin.changed',

  /**
   * Event to sync group participants
   */
  GROUP_PARTICIPANTS_SYNC = 'group.participants.sync',
}

/**
 * WhatsApp message event types for queue messages
 */
export enum MessageEventType {
  /**
   * Event when a message is received from a participant
   */
  MESSAGE_RECEIVED = 'message.received',

  /**
   * Event when a message is sent to a participant
   */
  MESSAGE_SENT = 'message.sent',

  /**
   * Event when a message delivery status changes
   */
  MESSAGE_STATUS_CHANGED = 'message.status.changed',
}

/**
 * WhatsApp poll event types for queue messages
 */
export enum PollEventType {
  /**
   * Event when a poll vote is updated
   */
  POLL_VOTE_UPDATE = 'poll.vote.update',
}

/**
 * WhatsApp message reaction event types for queue messages
 */
export enum MessageReactionEventType {
  /**
   * Event when a message reaction is added
   */
  MESSAGE_REACTION_ADDED = 'message.reaction.added',

  /**
   * Event when a message reaction is removed
   */
  MESSAGE_REACTION_REMOVED = 'message.reaction.removed',
}
