import { MessageMediaType } from "./message-events";

/**
 * Interface for poll option
 */
export interface PollOption {
  /**
   * Text for the poll option
   */
  readonly text: string;

  /**
   * Optional ID for the poll option (for tracking responses)
   */
  readonly id?: string;
}

/**
 * Interface for outbound message job data
 */
export interface OutboundMessageJobData {
  /**
   * Phone number to send the message to
   */
  readonly phoneNumber: string;

  /**
   * Content of the message
   */
  readonly content: string;

  /**
   * Correlation ID for tracing events through the system
   */
  readonly correlationId: string;

  /**
   * Media data (optional)
   */
  readonly media?: {
    /**
     * Base64 data of the media
     */
    readonly base64Data?: string;

    /**
     * URL to the media
     */
    readonly mediaUrl?: string;

    /**
     * MIME type of the media
     */
    readonly mimetype?: string;

    /**
     * Filename for the media
     */
    readonly filename?: string;

    /**
     * Type of media
     */
    readonly mediaType?: MessageMediaType;
  };

  /**
   * Poll data (optional) - Used for sending polls
   */
  readonly poll?: {
    /**
     * Options for the poll
     */
    readonly options: PollOption[];

    /**
     * Whether multiple options can be selected
     */
    readonly isMultipleChoice?: boolean;
  };

  /**
   * Additional metadata
   */
  readonly metadata?: {
    /**
     * Type of message (e.g., 'FACE_RECOGNITION', 'NOTIFICATION', etc.)
     */
    readonly type: string;

    /**
     * ID of the source entity (e.g., personId, userId, etc.)
     */
    readonly sourceId?: string;

    /**
     * ID of the group where the message originated
     */
    readonly groupId?: string;

    /**
     * Additional data specific to the message type
     */
    readonly additionalData?: Record<string, unknown>;

    /**
     * Timestamp of the message
     */
    readonly timestamp: Date;
  };
}
