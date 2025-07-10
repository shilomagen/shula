import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import he from '@/locales/he';
import { AlertCircle } from 'lucide-react';
import { WhatsAppStatusData } from '../types';

export interface ConnectionWarningProps {
  data: WhatsAppStatusData;
}

export function ConnectionWarning({ data }: ConnectionWarningProps) {
  if (!data.failureCount || data.failureCount <= 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {he.whatsappStatus.status.reconnect}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">
            {data.failureCount > 1
              ? `נמצאו ${data.failureCount} כשלונות חיבור רצופים. יש לסרוק את קוד ה-QR כדי להתחבר מחדש.`
              : 'נמצא כשל חיבור. יש לסרוק את קוד ה-QR כדי להתחבר מחדש.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
