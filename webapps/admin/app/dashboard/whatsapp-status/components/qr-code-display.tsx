import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWhatsAppQrCode } from '@/lib/hooks/use-whatsapp-status';
import he from '@/locales/he';
import { RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export function QrCodeDisplay() {
  const { data: qrCodeData, isLoading, refetch } = useWhatsAppQrCode();
  const [isExpired, setIsExpired] = useState(false);

  // Check if QR code is expired (older than 30 seconds)
  useEffect(() => {
    if (qrCodeData?.updatedAt) {
      const updatedAt = new Date(String(qrCodeData.updatedAt));
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      setIsExpired(updatedAt < thirtySecondsAgo);
    }
  }, [qrCodeData]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <Skeleton className="h-64 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (!qrCodeData?.qrCode || isExpired) {
    return (
      <div className="flex flex-col items-center justify-center p-6 space-y-4">
        <div className="h-64 w-64 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg">
          <div className="text-center p-4">
            <p className="text-gray-500 mb-4">
              {he.whatsappStatus.status.qrCode.unavailable}
            </p>
            <Button onClick={() => refetch()} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              {he.whatsappStatus.status.qrCode.refresh}
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {isExpired
            ? he.whatsappStatus.status.qrCode.expired
            : he.whatsappStatus.status.qrCode.unavailable}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <QRCodeSVG value={qrCodeData.qrCode} size={256} level="H" />
      </div>
      <p className="text-sm text-gray-600 max-w-md text-center">
        {he.whatsappStatus.status.qrCode.scan}
      </p>
    </div>
  );
}
