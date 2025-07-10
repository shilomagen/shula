import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWhatsAppStatus } from '@/lib/hooks/use-whatsapp-status';
import he from '@/locales/he';
import { formatDistanceToNow } from 'date-fns';
import { he as heLocale } from 'date-fns/locale';
import { RefreshCw } from 'lucide-react';
import { StatusIndicator } from './status-indicator';

export function StatusDetails() {
  const { data, isLoading, refetch } = useWhatsAppStatus();

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      </div>
    );
  }

  const lastUpdated = data.updatedAt
    ? formatDistanceToNow(new Date(String(data.updatedAt)), {
        addSuffix: true,
        locale: heLocale,
      })
    : '';

  // Safely handle state which might be null or undefined
  const stateValue = data.state ? String(data.state) : null;
  const stateDisplay = stateValue || he.whatsappStatus.status.unknown;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold">
            {he.whatsappStatus.status.title}
          </h3>
          <StatusIndicator isHealthy={data.isHealthy} state={stateValue} />
        </div>
        <Button onClick={() => refetch()} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          {he.whatsappStatus.actions.refresh}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">
              {he.whatsappStatus.status.state}:
            </span>
            <span className="text-sm font-medium">{stateDisplay}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">
              {he.whatsappStatus.status.failureCount}:
            </span>
            <span className="text-sm font-medium">
              {data.failureCount || 0}
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">
              {he.whatsappStatus.status.lastUpdated}:
            </span>
            <span className="text-sm font-medium">{lastUpdated}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-500">
              {he.whatsappStatus.status.qrCode.title}:
            </span>
            <span className="text-sm font-medium">
              {data.hasQrCode
                ? he.whatsappStatus.status.qrCode.available
                : he.whatsappStatus.status.qrCode.unavailable}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
