/**
 * Enums for domain models
 * These enums are used to ensure type safety for categorical values in the database
 */

/**
 * Status values for entities like Group, Participant, Person
 */
export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

/**
 * Status values for photo processing
 */
export enum PhotoProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Status values for conversations
 */
export enum ConversationStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

/**
 * Types of conversations
 */
export enum ConversationType {
  ONBOARDING = 'onboarding',
  SUPPORT = 'support',
  PERSON_REGISTRATION = 'personRegistration',
  GENERAL = 'general',
}

/**
 * Status values for messages
 */
export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

/**
 * Types of media in messages
 */
export enum MediaType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

/**
 * Status values for media distribution
 */
export enum MediaDistributionStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
}

/**
 * Relationship types between participants and persons
 */
export enum ParticipantPersonRelationship {
  PARENT = 'parent',
  GUARDIAN = 'guardian',
  RELATIVE = 'relative',
  OTHER = 'other',
}

export enum MessageType {
  USER_MESSAGE = 'USER_MESSAGE',
  AGENT_MESSAGE = 'AGENT_MESSAGE',
  IMAGE_UPLOAD = 'IMAGE_UPLOAD',
  PERSON_CREATED = 'PERSON_CREATED',
  PERSON_CONNECTED = 'PERSON_CONNECTED',
  SYSTEM_EVENT = 'SYSTEM_EVENT',
}

export enum MediaStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DELETED = 'DELETED',
}
