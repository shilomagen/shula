'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWhatsAppStatus } from '@/lib/hooks/use-whatsapp-status';
import he from '@/locales/he';
import { ConnectionWarning, QrCodeDisplay, StatusDetails } from './components';
import { WhatsAppStatusData } from './types';

export default function WhatsAppStatusPage() {
  const { data } = useWhatsAppStatus();

  // Convert the API response to the expected type
  const convertedData: WhatsAppStatusData | null = data
    ? {
        isHealthy: data.isHealthy,
        state: data.state ? String(data.state) : null,
        failureCount: data.failureCount || 0,
        hasQrCode: data.hasQrCode,
        updatedAt: data.updatedAt,
      }
    : null;

  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{he.whatsappStatus.title}</h1>
        <p className="text-muted-foreground">{he.whatsappStatus.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>{he.whatsappStatus.status.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDetails />
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>{he.whatsappStatus.status.qrCode.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <QrCodeDisplay />
          </CardContent>
        </Card>
      </div>

      {convertedData && <ConnectionWarning data={convertedData} />}
    </div>
  );
}
