'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useParticipant } from '@/lib/hooks/use-participants';
import he from '@/locales/he';

interface ParticipantInfoProps {
  participantId: string;
}

export function ParticipantInfo({ participantId }: ParticipantInfoProps) {
  const { data: participant, isLoading } = useParticipant(participantId);

  if (isLoading) {
    return <ParticipantInfoSkeleton />;
  }

  const initials = participant?.name
    ? participant.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'NA';

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8 bg-primary/10">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-medium">
          {participant?.name || he.conversations.participant.unknown}
        </span>
        <span className="text-xs text-muted-foreground">
          {participant?.phoneNumber || participantId}
        </span>
      </div>
    </div>
  );
}

export function ParticipantInfoSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
