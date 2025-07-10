'use server';

import { whatsAppStatusApi } from '@/lib/api-client';

/**
 * Get the current WhatsApp status
 */
export async function getWhatsAppStatus() {
  const response = await whatsAppStatusApi.getStatus();
  return response.data;
}

/**
 * Get the current WhatsApp QR code
 */
export async function getWhatsAppQrCode() {
  const response = await whatsAppStatusApi.getWhatsAppQrCode();
  return response.data;
}
