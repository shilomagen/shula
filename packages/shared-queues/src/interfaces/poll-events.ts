import { PollEventType } from '../constants/event-types';

/**
 * Base interface for all poll events
 */
export interface BasePollEvent {
  /**
   * Type of the poll event
   */
  eventType: PollEventType;

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
 * Interface for selected poll option
 */
export interface SelectedPollOption {
  /**
   * The local selected option ID
   */
  id: number;

  /**
   * The option name
   */
  name: string;
}

/**
 * Event payload when a poll vote is updated
 */
export interface PollVoteUpdateEvent extends BasePollEvent {
  /**
   * Type of the event - must be POLL_VOTE_UPDATE
   */
  eventType: PollEventType.POLL_VOTE_UPDATE;

  /**
   * The WhatsApp ID of the voter
   */
  voterId: string;

  /**
   * The selected poll options
   */
  selectedOptions: SelectedPollOption[];

  /**
   * Timestamp when the vote was cast
   */
  interactedAt: number;

  /**
   * The WhatsApp group ID where the poll was created
   */
  groupId: string;

  /**
   * The poll message ID
   */
  pollMessageId: string;

  /**
   * The poll name/question
   */
  pollName: string;

  /**
   * All available poll options
   */
  pollOptions: string[];

  /**
   * Whether multiple answers are allowed
   */
  allowMultipleAnswers: boolean;
}

/**
 * Union type of all poll events
 */
export type PollEvent = PollVoteUpdateEvent;
