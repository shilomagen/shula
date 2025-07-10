'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import he from '@/locales/he';
import {
  User,
  Phone,
  Calendar,
  Mail,
  MapPin,
  UserCircle2,
  Building,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ParticipantCardProps {
  participant?: {
    id: string;
    name: string;
    phoneNumber: string;
    email?: string;
    address?: string;
    status?: string;
    createdAt?: string;
    groupId?: string;
    groupName?: string;
  };
  isLoading: boolean;
}

export function ParticipantCard({
  participant,
  isLoading,
}: ParticipantCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-[250px]" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  if (!participant) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{he.conversations.chat.participantInfo}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{he.common.noData}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle2 className="h-5 w-5 text-primary" />
          {he.conversations.chat.participantInfo}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{participant.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{participant.phoneNumber}</span>
        </div>

        {participant.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{participant.email}</span>
          </div>
        )}

        {participant.address && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{participant.address}</span>
          </div>
        )}

        {participant.createdAt && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {new Date(participant.createdAt).toLocaleDateString('he-IL')}
            </span>
          </div>
        )}

        {participant.status && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {he.common.status}:
            </span>
            <Badge
              variant={
                participant.status === 'active'
                  ? 'default'
                  : participant.status === 'inactive'
                  ? 'secondary'
                  : 'default'
              }
            >
              {participant.status === 'active'
                ? he.participants.status.active
                : participant.status === 'inactive'
                ? he.participants.status.inactive
                : participant.status}
            </Badge>
          </div>
        )}

        {participant.groupName && (
          <>
            <Separator />
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">קבוצה:</span>
              <span>{participant.groupName}</span>
            </div>
          </>
        )}

        <Separator />

        <Button variant="outline" className="w-full" asChild>
          <Link href={`/dashboard/participants/${participant.id}`}>
            {he.participants.title}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
