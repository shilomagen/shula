'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getAllParticipants } from '@/lib/actions/participants';
import { ParticipantsResponseDto } from '@/generated/http-clients/backend';
import he from '@/locales/he';
import { useQuery } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Copy, Phone, UserCheck } from 'lucide-react';

interface ParticipantsSectionProps {
  groupId: string;
}

export function ParticipantsSection({ groupId }: ParticipantsSectionProps) {
  // Fetch participants data using React Query directly with the server action
  const { data: participants, isLoading: isLoadingParticipants } = useQuery({
    queryKey: ['participants', 'list', { groupId }],
    queryFn: () => getAllParticipants(groupId),
  });

  // Define columns for the data table
  const participantColumns: ColumnDef<ParticipantsResponseDto>[] = [
    {
      accessorKey: 'name',
      header: () => he.participants.fields.name,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'phoneNumber',
      header: () => he.participants.fields.phoneNumber,
      cell: ({ row }) => {
        const phoneNumber = row.getValue('phoneNumber') as string;
        return (
          <div className="flex items-center space-x-0 space-x-reverse space-x-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{phoneNumber}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => navigator.clipboard.writeText(phoneNumber)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>{he.participants.fields.copyPhone}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: () => he.common.status,
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge
            variant={status === 'active' ? 'default' : 'destructive'}
            className="px-2 py-0.5 text-xs"
          >
            {status === 'active'
              ? he.participants.status.active
              : he.participants.status.inactive}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'joinedAt',
      header: () => he.participants.fields.joinedAt,
      cell: ({ row }) => {
        const joinedAt = row.getValue('joinedAt') as string;
        return (
          <div className="text-sm">
            {new Date(joinedAt).toLocaleDateString('he-IL')}
          </div>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{he.groups.metrics.groupParticipants}</CardTitle>
          <Button className="text-right">
            <UserCheck className="h-4 w-4 ml-2" />
            {he.groups.actions.manageParticipants}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoadingParticipants ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <DataTable columns={participantColumns} data={participants || []} />
        )}
      </CardContent>
    </Card>
  );
}
