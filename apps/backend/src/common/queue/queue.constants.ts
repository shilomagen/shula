export enum QueueName {
  WHATSAPP_MESSAGES = 'whatsapp-messages',
  FACE_RECOGNITION = 'face-recognition',
  NOTIFICATION = 'notification',
  GROUP_EVENTS = 'group-events',
  PERSONS = 'persons',
  DELAYED_RESPONSE = 'delayed-response',
  PARTICIPANT_OPERATIONS = 'participant-operations',
  GROUP_REMOVAL = 'group-removal',
}

export enum ProcessorName {
  PROCESS_WHATSAPP_MESSAGE = 'process-whatsapp-message',
  PROCESS_PHOTO = 'process-photo',
  RECOGNIZE_FACES = 'recognize-faces',
  SEND_NOTIFICATION = 'send-notification',
  HANDLE_GROUP_ADDED = 'handle-group-added',
  DELETE_PERSON_REKOGNITION = 'delete-person-rekognition',
  PROCESS_DELAYED_RESPONSE = 'process-delayed-response',
  REMOVE_PARTICIPANT = 'remove-participant',
  REMOVE_GROUP = 'remove-group',
}

// Type definitions for queue job data
export interface DelayedResponseJobData {
  participantId: string;
  messageId: string;
  content: string;
}

/**
 * Interface for remove participant job data
 */
export interface RemoveParticipantJobData {
  participantId: string;
  groupId: string;
  participantName?: string;
}

/**
 * Interface for remove group job data
 */
export interface RemoveGroupJobData {
  groupId: string;
  groupName: string;
  whatsappGroupId: string;
}

/**
 * Interface for group removal flow data
 */
export interface GroupRemovalFlowData {
  groupId: string;
  groupName: string;
  whatsappGroupId: string;
}
