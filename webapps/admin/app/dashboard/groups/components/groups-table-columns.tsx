'use client';

import { GroupsResponseDto } from '@/generated/http-clients/backend';
import he from '@/locales/he';
import { ColumnDef } from '@tanstack/react-table';
import { ConsentStatusDisplay } from './consent-status-display';
import { DateDisplay } from './date-display';
import { GroupActionMenu } from './group-action-menu';
import { IdCopyButton } from './id-copy-button';
import { ParticipantCountInfo } from './participant-count-info';
import { StatusBadge } from './status-badge';

interface CreateColumnsProps {
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function createGroupColumns({
  onActivate,
  onDeactivate,
  onDelete,
}: CreateColumnsProps): ColumnDef<GroupsResponseDto>[] {
  return [
    {
      accessorKey: 'id',
      header: () => <div>{he.groups.fields.id}</div>,
      cell: ({ row }) => {
        const id = row.getValue('id') as string;
        return <IdCopyButton id={id} />;
      },
      size: 60,
    },
    {
      accessorKey: 'name',
      header: () => <div>{he.groups.fields.name}</div>,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'personsCount',
      header: () => <div>{he.persons.fields.personCount}</div>,
      cell: ({ row }) => {
        const personsCount = row.getValue('personsCount') as number;
        const participantsCount = row.getValue('participantsCount') as number;
        return (
          <ParticipantCountInfo
            personsCount={personsCount}
            participantsCount={participantsCount}
            variant="persons"
          />
        );
      },
    },
    {
      accessorKey: 'participantsCount',
      header: () => <div>{he.groups.fields.participantsCount}</div>,
      cell: ({ row }) => {
        const personsCount = row.getValue('personsCount') as number;
        const participantsCount = row.getValue('participantsCount') as number;
        return (
          <ParticipantCountInfo
            personsCount={personsCount}
            participantsCount={participantsCount}
            variant="participants"
          />
        );
      },
    },
    {
      id: 'consentStatus',
      header: () => <div>{he.groups.fields.consentStatus}</div>,
      cell: ({ row }) => {
        const groupId = row.original.id;
        return <ConsentStatusDisplay groupId={groupId} />;
      },
      size: 150,
    },
    {
      accessorKey: 'status',
      header: () => <div>{he.groups.fields.status}</div>,
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return <StatusBadge status={status as 'active' | 'inactive'} />;
      },
    },
    {
      accessorKey: 'createdAt',
      header: () => <div>{he.groups.fields.createdAt}</div>,
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string;
        return <DateDisplay date={date} />;
      },
    },
    {
      id: 'actions',
      header: () => <div>{he.common.actions}</div>,
      cell: ({ row }) => {
        const group = row.original;
        return (
          <GroupActionMenu
            group={group}
            onActivate={onActivate}
            onDeactivate={onDeactivate}
            onDelete={onDelete}
          />
        );
      },
    },
  ];
}
