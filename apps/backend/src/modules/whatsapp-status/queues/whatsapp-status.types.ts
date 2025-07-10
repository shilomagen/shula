/**
 * Interface for WhatsApp status update data
 * This is a simplified version of the WhatsAppStatusEvent from shared-queues
 * for use in the backend service
 */
export interface WhatsAppStatusData {
  isHealthy: boolean;
  state: string | null;
  failureCount: number;
  timestamp: number;
}

/**
 * Interface for WhatsApp QR code data
 * This is a simplified version of the WhatsAppQrCodeEvent from shared-queues
 * for use in the backend service
 */
export interface WhatsAppQrCodeData {
  qrCode: string;
  timestamp: number;
}
