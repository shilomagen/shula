'use client';

import he from '@/locales/he';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { Clock } from 'lucide-react';

type DisplayFormat = 'date' | 'time' | 'datetime' | 'relative';
type DisplayStyle = 'text' | 'with-icon';

interface DateDisplayProps {
  date: string | Date | undefined;
  format?: DisplayFormat;
  style?: DisplayStyle;
  locale?: string;
  className?: string;
  iconClassName?: string;
}

export function DateDisplay({
  date,
  format = 'date',
  style = 'text',
  locale = 'he-IL',
  className = '',
  iconClassName = '',
}: DateDisplayProps) {
  if (!date) {
    return <span className={className}>-</span>;
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const formatDate = () => {
    if (format === 'relative') {
      return formatDistanceToNow(dateObj, {
        addSuffix: true,
        locale: dateFnsHe,
      });
    } else if (format === 'time') {
      return dateObj.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (format === 'datetime') {
      return dateObj.toLocaleString(locale);
    } else {
      return dateObj.toLocaleDateString(locale);
    }
  };

  if (style === 'with-icon') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className={`h-4 w-4 text-muted-foreground ${iconClassName}`} />
        <span>{formatDate()}</span>
      </div>
    );
  }

  return <div className={`text-sm ${className}`}>{formatDate()}</div>;
}
