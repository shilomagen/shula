/**
 * System message types and interfaces
 */

/**
 * Enum for system message categories
 */
export enum SystemMessageCategory {
  GROUP = 'GROUP',
  PERSON = 'PERSON',
  NOTIFICATION = 'NOTIFICATION',
  GENERAL = 'GENERAL',
}

/**
 * Interface for system message entity
 */
export interface SystemMessage {
  id: string;
  key: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  status: string;
}

/**
 * Interface for system message with template parameters
 */
export interface SystemMessageWithParams {
  message: SystemMessage;
  params?: Record<string, string | number | boolean>;
}

/**
 * Interface for system message template result
 */
export interface SystemMessageTemplateResult {
  key: string;
  content: string;
  metadata?: Record<string, unknown>;
}
