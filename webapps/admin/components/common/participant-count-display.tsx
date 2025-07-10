'use client';

import { UserCheck, Users } from 'lucide-react';

type CountType = 'persons' | 'participants' | 'both';
type DisplayStyle = 'horizontal' | 'vertical';

interface CountItemProps {
  count: number;
  icon: React.ReactNode;
  className?: string;
}

function CountItem({ count, icon, className = '' }: CountItemProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {icon}
      <span>{count || 0}</span>
    </div>
  );
}

interface ParticipantCountDisplayProps {
  personsCount?: number;
  participantsCount?: number;
  displayType?: CountType;
  layout?: DisplayStyle;
  personsIconColor?: string;
  participantsIconColor?: string;
  className?: string;
}

export function ParticipantCountDisplay({
  personsCount = 0,
  participantsCount = 0,
  displayType = 'both',
  layout = 'vertical',
  personsIconColor = 'text-indigo-500',
  participantsIconColor = 'text-blue-500',
  className = '',
}: ParticipantCountDisplayProps) {
  const personsIcon = <Users className={`h-3.5 w-3.5 ${personsIconColor}`} />;
  const participantsIcon = (
    <UserCheck className={`h-3.5 w-3.5 ${participantsIconColor}`} />
  );

  return (
    <div
      className={`flex ${
        layout === 'vertical' ? 'flex-col' : 'items-center'
      } gap-1 ${className}`}
    >
      {(displayType === 'both' || displayType === 'persons') && (
        <CountItem count={personsCount} icon={personsIcon} />
      )}

      {(displayType === 'both' || displayType === 'participants') && (
        <CountItem count={participantsCount} icon={participantsIcon} />
      )}
    </div>
  );
}
