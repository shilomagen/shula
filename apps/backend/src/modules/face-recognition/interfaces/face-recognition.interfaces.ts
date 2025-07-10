import { ImageMessageMedia } from '@shula/shared-queues';

/**
 * Data structure for face recognition job
 */
export interface FaceRecognitionJobData {
  /**
   * ID of the message containing the image
   */
  messageId: string;

  /**
   * ID of the group where the message was sent
   */
  groupId: string;

  /**
   * ID of the chat where the message was sent
   */
  chatId: string;

  /**
   * Image media data (base64 or URL)
   * For backward compatibility, we still support mediaUrl
   * @deprecated Use imageMedia instead
   */
  mediaUrl?: string;

  /**
   * Image media data with type information
   */
  imageMedia?: ImageMessageMedia;

  /**
   * Phone number of the sender who sent the message
   * Used to avoid sending notifications back to the sender
   */
  senderPhoneNumber: string;
}

/**
 * Result of face recognition processing
 */
export interface FaceRecognitionResult {
  messageId: string;
  groupId: string;
  recognizedPersons: RecognizedPerson[];
  success: boolean;
  error?: string;
}

/**
 * Information about a recognized person
 */
export interface RecognizedPerson {
  personId: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

/**
 * Bounding box for a face in an image
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}
