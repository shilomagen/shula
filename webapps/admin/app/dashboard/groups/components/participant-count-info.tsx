'use client';

import { UserCheck, Users } from 'lucide-react';

interface ParticipantCountInfoProps {
  personsCount: number;
  participantsCount: number;
  variant?: 'persons' | 'participants' | 'both';
  className?: string;
}

export function ParticipantCountInfo({
  personsCount,
  participantsCount,
  variant = 'both',
  className = '',
}: ParticipantCountInfoProps) {
  return (
    <div
      className={`flex ${
        variant === 'both' ? 'flex-col' : 'items-center'
      } gap-1 ${className}`}
    >
      {(variant === 'both' || variant === 'persons') && (
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-indigo-500" />
          <span>{personsCount || 0}</span>
        </div>
      )}

      {(variant === 'both' || variant === 'participants') && (
        <div className="flex items-center gap-1">
          <UserCheck className="h-3.5 w-3.5 text-blue-500" />
          <span>{participantsCount || 0}</span>
        </div>
      )}
    </div>
  );
}
