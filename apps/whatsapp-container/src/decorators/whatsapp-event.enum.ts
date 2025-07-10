/**
 * Enum representing all possible WhatsApp events that can be traced
 */
export enum WhatsAppEvent {
  // Authentication events
  QR_CODE = 'qr.code',
  READY = 'ready',
  AUTHENTICATION_FAILURE = 'authentication.failure',
  DISCONNECTED = 'disconnected',
  CHANGE_STATE = 'state.changed',
  LOADING_SCREEN = 'loading.screen',

  // Message events
  MESSAGE_RECEIVED = 'message.received',
  MESSAGE_ACK = 'message.ack',
  MESSAGE_CREATE = 'message.create',
  MESSAGE_REVOKE = 'message.revoke',
  MESSAGE_REACTION = 'message.reaction',
  MEDIA_UPLOADED = 'media.uploaded',

  // Group events
  GROUP_JOIN = 'group.join',
  GROUP_LEAVE = 'group.leave',
  GROUP_ADMIN_CHANGED = 'group.admin.changed',
}
