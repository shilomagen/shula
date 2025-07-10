'use client';

import he from '@/locales/he';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { Clock } from 'lucide-react';

interface DateTimeDisplayProps {
  dateString?: string;
}

export function DateTimeDisplay({ dateString }: DateTimeDisplayProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: dateFnsHe });
  };

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span>{formatDate(dateString)}</span>
    </div>
  );
}
