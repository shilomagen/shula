'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useActivateParticipant,
  useDeactivateParticipant,
} from '@/lib/hooks/use-participants';
import he from '@/locales/he';
import { format } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { CheckCircle, XCircle, CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ParticipantsResponseDto } from '@/generated/http-clients/backend/models';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ParticipantDetailsSectionProps {
  participant: ParticipantsResponseDto;
}

export function ParticipantDetailsSection({
  participant,
}: ParticipantDetailsSectionProps) {
  const activateParticipant = useActivateParticipant();
  const deactivateParticipant = useDeactivateParticipant();
  const [isUpdating, setIsUpdating] = useState(false);

  // Get initials from participant name
  const initials = participant.name
    ? participant.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'NA';

  const handleStatusToggle = async () => {
    setIsUpdating(true);
    try {
      if (participant.status === 'active') {
        await deactivateParticipant.mutateAsync(participant.id);
        toast.success(he.participants.deactivateSuccess);
      } else {
        await activateParticipant.mutateAsync(participant.id);
        toast.success(he.participants.activateSuccess);
      }
    } catch (error) {
      toast.error(
        participant.status === 'active'
          ? he.participants.deactivateError
          : he.participants.activateError
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="overflow-hidden border-2 border-muted/20">
      <CardHeader className="bg-muted/10">
        <CardTitle className="flex items-center justify-between">
          <span>{he.participants.title}</span>
          <Badge
            variant={participant.status === 'active' ? 'default' : 'secondary'}
            className="ms-2"
          >
            {participant.status === 'active'
              ? he.participants.status.active
              : he.participants.status.inactive}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column - Profile */}
          <div className="flex flex-col items-center">
            <Avatar className="h-32 w-32 mb-4 border-4 border-primary/10 shadow-md">
              <AvatarFallback className="text-3xl bg-gradient-to-br from-primary/80 to-primary/30 text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="text-center mb-4">
              <h2 className="text-xl font-semibold mb-1">{participant.name}</h2>
            </div>

            <Button
              onClick={handleStatusToggle}
              variant={
                participant.status === 'active' ? 'destructive' : 'default'
              }
              className="mb-2 w-full max-w-52 flex flex-row-reverse"
              disabled={isUpdating}
            >
              {isUpdating ? (
                he.common.updating
              ) : participant.status === 'active' ? (
                <>
                  {he.participants.actions.deactivate}
                  <XCircle className="mr-2 h-4 w-4" />
                </>
              ) : (
                <>
                  {he.participants.actions.activate}
                  <CheckCircle className="mr-2 h-4 w-4" />
                </>
              )}
            </Button>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full max-w-52 flex flex-row-reverse"
                    onClick={() => {
                      navigator.clipboard.writeText(participant.id);
                      toast.success(he.common.success);
                    }}
                  >
                    {he.participants.fields.id}
                    <span className="mr-2 text-xs text-muted-foreground font-mono">
                      {participant.id.substring(0, 8)}...
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{participant.id}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Right column - Details */}
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-lg font-semibold mb-4">
                {he.participants.title}
              </h3>

              <div className="space-y-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground ml-0.5 mr-2.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {he.participants.fields.joinedAt}
                    </p>
                    <p className="text-sm font-medium">
                      {participant.joinedAt
                        ? format(new Date(participant.joinedAt), 'PPP', {
                            locale: dateFnsHe,
                          })
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground ml-0.5 mr-2.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {he.participants.fields.phoneNumber}
                    </p>
                    <p className="text-sm font-medium">
                      {participant.phoneNumber}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
