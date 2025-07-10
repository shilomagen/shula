'use client';

import { Badge } from '@/components/ui/badge';
import he from '@/locales/he';

export type StatusVariant =
  | 'active'
  | 'inactive'
  | 'abandoned'
  | 'completed'
  | 'custom';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  entityType?: 'group' | 'conversation';
  customLabel?: string;
  className?: string;
}

export function StatusBadge({
  status,
  variant,
  entityType = 'group',
  customLabel,
  className = '',
}: StatusBadgeProps) {
  // If variant is not provided, try to determine it from status
  const resolvedVariant = variant || (status as StatusVariant);

  // Get the appropriate badge variant based on status
  const getBadgeVariant = () => {
    switch (resolvedVariant) {
      case 'active':
        return 'default';
      case 'inactive':
        return entityType === 'group' ? 'destructive' : 'secondary';
      case 'abandoned':
        return 'destructive';
      case 'completed':
        return 'default';
      default:
        return 'outline';
    }
  };

  // Get the appropriate label based on status and entity type
  const getLabel = () => {
    if (customLabel) return customLabel;

    if (entityType === 'group') {
      switch (resolvedVariant) {
        case 'active':
          return he.groups.status.active;
        case 'inactive':
          return he.groups.status.inactive;
        default:
          return status;
      }
    } else {
      // Conversation labels
      switch (resolvedVariant) {
        case 'active':
          return he.conversations.status.active;
        case 'inactive':
          return he.conversations.status.inactive;
        case 'abandoned':
          return he.conversations.status.abandoned;
        case 'completed':
          return he.conversations.status.completed;
        default:
          return status;
      }
    }
  };

  return (
    <Badge
      variant={getBadgeVariant()}
      className={`px-2 py-0 text-xs ${className}`}
    >
      {getLabel()}
    </Badge>
  );
}
