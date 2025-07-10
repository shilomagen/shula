import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getWhatsAppStatus,
  getWhatsAppQrCode,
} from '../actions/whatsapp-status';

// Hook for fetching WhatsApp status
export function useWhatsAppStatus() {
  return useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: async () => {
      try {
        return await getWhatsAppStatus();
      } catch (error) {
        toast.error('Failed to fetch WhatsApp status');
        throw error;
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

// Hook for fetching WhatsApp QR code
export function useWhatsAppQrCode() {
  return useQuery({
    queryKey: ['whatsapp-qrcode'],
    queryFn: async () => {
      try {
        return await getWhatsAppQrCode();
      } catch (error) {
        toast.error('Failed to fetch WhatsApp QR code');
        throw error;
      }
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}
