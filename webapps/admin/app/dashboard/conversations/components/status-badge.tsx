'use client';

import { Badge } from '@/components/ui/badge';
import he from '@/locales/he';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case 'active':
      return <Badge variant="default">{he.conversations.status.active}</Badge>;
    case 'inactive':
      return (
        <Badge variant="secondary">{he.conversations.status.inactive}</Badge>
      );
    case 'abandoned':
      return (
        <Badge variant="destructive">{he.conversations.status.abandoned}</Badge>
      );
    case 'completed':
      return (
        <Badge variant="default">{he.conversations.status.completed}</Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
