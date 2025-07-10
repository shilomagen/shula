'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ParticipantConsentResponseDto,
  GroupConsentStatusResponseDtoStatusEnum,
} from '@/generated/http-clients/backend';
import {
  getGroupConsentStatus,
  getParticipantConsentsByGroupId,
  updateParticipantConsent,
} from '@/lib/actions/participant-consents';
import { formatDate } from '@/lib/utils';
import he from '@/locales/he';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { Calendar, Check, Clock, Copy, Phone, X } from 'lucide-react';

interface ConsentStatusSectionProps {
  groupId: string;
}

export function ConsentStatusSection({ groupId }: ConsentStatusSectionProps) {
  const queryClient = useQueryClient();

  // Fetch consent status and participant consents using React Query
  const { data: consentStatus, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['group-consent-status', groupId],
    queryFn: () => getGroupConsentStatus(groupId),
  });

  const { data: consents, isLoading: isLoadingConsents } = useQuery({
    queryKey: ['participant-consents', groupId],
    queryFn: () => getParticipantConsentsByGroupId(groupId),
  });

  // Mutation for updating consent status
  const updateConsentMutation = useMutation({
    mutationFn: ({
      participantId,
      consentStatus,
    }: {
      participantId: string;
      consentStatus: string;
    }) => updateParticipantConsent(groupId, participantId, consentStatus),
    onSuccess: () => {
      // Invalidate relevant queries to refetch data
      queryClient.invalidateQueries({
        queryKey: ['participant-consents', groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['group-consent-status', groupId],
      });
    },
  });

  // Handle status change
  const handleStatusChange = async (
    participantId: string,
    newStatus: string
  ) => {
    try {
      await updateConsentMutation.mutateAsync({
        participantId,
        consentStatus: newStatus,
      });
    } catch (error) {
      console.error('Failed to update consent status:', error);
    }
  };

  // Define columns for the data table
  const consentColumns: ColumnDef<ParticipantConsentResponseDto>[] = [
    {
      accessorKey: 'participantName',
      header: () => he.participants.fields.name,
      cell: ({ row }) => (
        <div className="font-medium">
          {row.getValue('participantName') || 'N/A'}
        </div>
      ),
    },
    {
      accessorKey: 'participantPhoneNumber',
      header: () => he.participants.fields.phoneNumber,
      cell: ({ row }) => {
        const phoneNumber = row.getValue('participantPhoneNumber') as string;
        return (
          <div className="flex items-center space-x-0 space-x-reverse space-x-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{phoneNumber || 'N/A'}</span>
            {phoneNumber && (
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
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'consentStatus',
      header: () => he.common.status,
      cell: ({ row }) => {
        const status = row.getValue('consentStatus');
        let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' =
          'outline';
        let statusText = '';

        switch (status) {
          case 'accepted':
            badgeVariant = 'default';
            statusText = he.groups.metrics.consentStatuses.accepted;
            break;
          case 'rejected':
            badgeVariant = 'destructive';
            statusText = he.groups.metrics.consentStatuses.rejected;
            break;
          default:
            badgeVariant = 'outline';
            statusText = he.groups.metrics.consentStatuses.pending;
        }

        return (
          <Badge variant={badgeVariant} className="px-2 py-0.5 text-xs">
            {statusText}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'respondedAt',
      header: () => he.groups.metrics.respondedAt,
      cell: ({ row }) => {
        const date = row.getValue('respondedAt') as string | null;
        return (
          <div className="flex items-center space-x-0 space-x-reverse space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {date ? formatDate(date) : he.groups.metrics.notResponded}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => he.common.actions,
      cell: ({ row }) => {
        const participantId = row.original.participantId;
        const currentStatus = row.original.consentStatus;

        return (
          <div className="flex items-center justify-end space-x-0 space-x-reverse space-x-2">
            <Select
              value={currentStatus}
              onValueChange={(value) =>
                handleStatusChange(participantId, value)
              }
              disabled={updateConsentMutation.isPending}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder={he.groups.metrics.updateConsent} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">
                  {he.groups.metrics.consentStatuses.pending}
                </SelectItem>
                <SelectItem value="accepted">
                  {he.groups.metrics.consentStatuses.accepted}
                </SelectItem>
                <SelectItem value="rejected">
                  {he.groups.metrics.consentStatuses.rejected}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Group Consent Status Card */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">
          {he.groups.metrics.groupConsentStatus}
        </h3>

        {isLoadingStatus ? (
          <Skeleton className="h-8 w-full" />
        ) : consentStatus ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-0 space-x-reverse space-x-2">
              {consentStatus.status ===
              GroupConsentStatusResponseDtoStatusEnum.Approved ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : consentStatus.status ===
                GroupConsentStatusResponseDtoStatusEnum.Rejected ? (
                <X className="h-5 w-5 text-red-500" />
              ) : (
                <Clock className="h-5 w-5 text-amber-500" />
              )}

              <span className="font-medium">
                {consentStatus.status ===
                GroupConsentStatusResponseDtoStatusEnum.Approved
                  ? he.groups.metrics.consentApproved
                  : consentStatus.status ===
                    GroupConsentStatusResponseDtoStatusEnum.Rejected
                  ? he.groups.metrics.consentRejected
                  : he.groups.metrics.consentPending}
              </span>
            </div>

            <div className="text-sm text-muted-foreground">
              {he.groups.metrics.consentRequired}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            {he.common.noData}
          </div>
        )}
      </div>

      {/* Participant Consents Table */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">
          {he.groups.metrics.participantConsents}
        </h3>

        {isLoadingConsents ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : consents && consents.length > 0 ? (
          <>
            <DataTable columns={consentColumns} data={consents} />
          </>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            {he.groups.metrics.noConsents}
          </div>
        )}
      </div>
    </div>
  );
}
