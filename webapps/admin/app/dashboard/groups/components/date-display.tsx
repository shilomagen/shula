'use client';

interface DateDisplayProps {
  date: string | Date;
  format?: 'date' | 'time' | 'datetime';
  locale?: string;
  className?: string;
}

export function DateDisplay({
  date,
  format = 'date',
  locale = 'he-IL',
  className = '',
}: DateDisplayProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const formattedDate = () => {
    if (format === 'time') {
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

  return <div className={`text-sm ${className}`}>{formattedDate()}</div>;
}
