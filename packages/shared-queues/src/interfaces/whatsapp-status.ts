/**
 * WhatsApp status event types
 */
export enum WhatsAppStatusEventType {
  /**
   * Event when the WhatsApp connection status is updated
   */
  STATUS_UPDATE = 'status-update',

  /**
   * Event when a new QR code is generated for authentication
   */
  QR_CODE_UPDATED = 'qr-code',
}

/**
 * Base interface for WhatsApp status events
 */
interface BaseWhatsAppStatusEvent {
  /**
   * Event correlation ID for tracking
   */
  correlationId: string;

  /**
   * When the event occurred
   */
  timestamp: number;
}

/**
 * Event payload for WhatsApp status updates
 */
export interface WhatsAppStatusEvent extends BaseWhatsAppStatusEvent {
  /**
   * Type of the event - must be STATUS_UPDATE
   */
  eventType: WhatsAppStatusEventType.STATUS_UPDATE;

  /**
   * Whether the WhatsApp connection is healthy
   */
  isHealthy: boolean;

  /**
   * Current state of the WhatsApp connection
   */
  state: string | null;

  /**
   * Number of consecutive connection failures
   */
  failureCount: number;
}

/**
 * Event payload for WhatsApp QR code updates
 */
export interface WhatsAppQrCodeEvent extends BaseWhatsAppStatusEvent {
  /**
   * Type of the event - must be QR_CODE_UPDATED
   */
  eventType: WhatsAppStatusEventType.QR_CODE_UPDATED;

  /**
   * The QR code data for authentication
   */
  qrCode: string;
}
