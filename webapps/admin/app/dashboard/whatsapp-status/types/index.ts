/**
 * WhatsApp status response data
 */
export interface WhatsAppStatusData {
  isHealthy: boolean;
  state: string | null;
  failureCount: number;
  hasQrCode: boolean;
  updatedAt: string | Date;
}

/**
 * WhatsApp QR code response data
 */
export interface WhatsAppQrCodeData {
  qrCode: string | null;
  updatedAt: string | Date | null;
}
