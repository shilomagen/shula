/**
 * Queue names used for communication between services
 */
export const QUEUE_NAMES = {
  /**
   * Queue for WhatsApp group management operations
   */
  GROUP_MANAGEMENT: 'whatsapp-group-management',

  /**
   * Queue for WhatsApp message processing
   */
  MESSAGE_PROCESSING: 'whatsapp-message-processing',

  /**
   * Queue for outbound message processing
   */
  OUTBOUND_MESSAGE: 'whatsapp-outbound-message',

  /**
   * Queue for person management operations
   */
  PERSONS: 'persons',

  /**
   * Queue for WhatsApp status events
   */
  WHATSAPP_STATUS: 'whatsapp-status',

  /**
   * Queue for WhatsApp poll events
   */
  POLL_EVENTS: 'whatsapp-poll-events',

  /**
   * Queue for WhatsApp message reaction events
   */
  MESSAGE_REACTIONS: 'whatsapp-message-reactions',
} as const;

/**
 * Processor names used for person management operations
 */
export const PERSON_PROCESSOR_NAMES = {
  /**
   * Delete a person from AWS Rekognition
   */
  DELETE_PERSON_REKOGNITION: 'delete-person-rekognition',

  /**
   * Delete faces from AWS Rekognition
   */
  DELETE_FACES_REKOGNITION: 'delete-faces-rekognition',

  /**
   * Parent flow for person deletion
   */
  DELETE_PERSON_FLOW: 'delete-person-flow',
} as const;

/**
 * Processor names used for WhatsApp message processing
 */
export const MESSAGE_PROCESSOR_NAMES = {
  /**
   * Process a delayed response to a media message
   */
  DELAYED_RESPONSE: 'delayed-response',
} as const;

/**
 * Processor names used for WhatsApp status events
 */
export const WHATSAPP_STATUS_PROCESSOR_NAMES = {
  /**
   * Process a status update event
   */
  STATUS_UPDATE: 'status-update',

  /**
   * Process a QR code event
   */
  QR_CODE: 'qr-code',
} as const;

/**
 * Processor names used for WhatsApp poll events
 */
export const POLL_PROCESSOR_NAMES = {
  /**
   * Process a poll vote update event
   */
  POLL_VOTE_UPDATE: 'poll-vote-update',
} as const;

/**
 * Processor names used for WhatsApp message reaction events
 */
export const MESSAGE_REACTION_PROCESSOR_NAMES = {
  /**
   * Process a message reaction added event
   */
  MESSAGE_REACTION_ADDED: 'message-reaction-added',

  /**
   * Process a message reaction removed event
   */
  MESSAGE_REACTION_REMOVED: 'message-reaction-removed',
} as const;

/**
 * Processor names for each queue
 */
export const PROCESSOR_NAMES = {
  WHATSAPP_STATUS: {
    STATUS_UPDATE: 'status-update',
    QR_CODE: 'qr-code',
  },
} as const;
