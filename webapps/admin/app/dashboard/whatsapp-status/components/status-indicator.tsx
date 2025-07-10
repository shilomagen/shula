import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import he from '@/locales/he';

export interface StatusIndicatorProps {
  isHealthy: boolean;
  state?: string | null;
}

export function StatusIndicator({ isHealthy, state }: StatusIndicatorProps) {
  if (isHealthy) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">{he.whatsappStatus.status.healthy}</span>
      </div>
    );
  }

  if (state === 'UNKNOWN') {
    return (
      <div className="flex items-center space-x-2 text-amber-600">
        <AlertCircle className="h-5 w-5" />
        <span className="font-medium">{he.whatsappStatus.status.unknown}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-red-600">
      <XCircle className="h-5 w-5" />
      <span className="font-medium">{he.whatsappStatus.status.unhealthy}</span>
    </div>
  );
}
