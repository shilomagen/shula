'use client';

import { Badge } from '@/components/ui/badge';
import he from '@/locales/he';

type GroupStatus = 'active' | 'inactive';

interface StatusBadgeProps {
  status: GroupStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <Badge
      variant={status === 'active' ? 'default' : 'destructive'}
      className={`px-2 py-0 text-xs ${className}`}
    >
      {status === 'active'
        ? he.groups.status.active
        : he.groups.status.inactive}
    </Badge>
  );
}
