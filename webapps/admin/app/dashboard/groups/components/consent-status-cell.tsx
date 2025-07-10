'use client';

import { useParticipantsConsentStatus } from '@/lib/hooks/use-groups';
import { FileCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ConsentStatusCellProps {
  groupId: string;
}

export function ConsentStatusCell({ groupId }: ConsentStatusCellProps) {
  const { data, isLoading } = useParticipantsConsentStatus(groupId);

  if (isLoading) {
    return <Skeleton className="h-4 w-20" />;
  }

  if (!data || !data.items || data.items.length === 0) {
    return <div className="text-muted-foreground text-sm">אין נתונים</div>;
  }

  const approvedCount = data.items.filter(
    (item) => item.status === 'accepted'
  ).length;

  const totalCount = data.items.length;
  const approvalPercentage = Math.round((approvedCount / totalCount) * 100);

  return (
    <div className="flex items-center gap-2">
      <FileCheck className="h-3.5 w-3.5 text-green-500" />
      <div>
        <span className="font-medium">
          {approvedCount}/{totalCount}
        </span>
        <span className="ms-1 text-muted-foreground text-xs">
          ({approvalPercentage}%)
        </span>
      </div>
    </div>
  );
}
