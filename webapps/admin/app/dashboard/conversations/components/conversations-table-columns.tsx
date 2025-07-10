'use client';

import { ConversationResponseDto } from '@/lib/hooks/use-conversations';
import { ColumnDef } from '@tanstack/react-table';
import he from '@/locales/he';
import { ParticipantInfo } from './participant-info';
import { StatusBadge } from './status-badge';
import { LastMessagePreview } from './last-message-preview';
import { DateTimeDisplay } from './date-time-display';
import { ConversationActionMenu } from './conversation-action-menu';
import { IdCopyButton } from './id-copy-button';

interface GetColumnsOptions {
  onViewConversation: (id: string) => void;
  onAbandonConversation: (id: string) => void;
}

export function getConversationsTableColumns({
  onViewConversation,
  onAbandonConversation,
}: GetColumnsOptions): ColumnDef<ConversationResponseDto>[] {
  return [
    {
      accessorKey: 'id',
      header: () => <div className="text-center">#</div>,
      cell: ({ row }) => {
        const id = row.getValue('id') as string;
        return <IdCopyButton id={id} />;
      },
    },
    {
      accessorKey: 'participantId',
      header: () => <div>{he.conversations.fields.participantName}</div>,
      cell: ({ row }) => {
        return <ParticipantInfo participantId={row.original.participantId} />;
      },
    },
    {
      accessorKey: 'status',
      header: () => <div>{he.conversations.fields.status}</div>,
      cell: ({ row }) => {
        return <StatusBadge status={row.getValue('status')} />;
      },
    },
    {
      accessorKey: 'currentNode',
      header: () => <div>{he.conversations.fields.currentNode}</div>,
      cell: ({ row }) => {
        const currentNode = row.getValue('currentNode') as string | undefined;
        return <div className="text-sm">{currentNode || '-'}</div>;
      },
    },
    {
      id: 'lastMessage',
      header: () => <div>{he.conversations.fields.lastMessage}</div>,
      cell: ({ row }) => {
        return <LastMessagePreview conversationId={row.original.id} />;
      },
    },
    {
      accessorKey: 'lastMessageAt',
      header: () => <div>{he.conversations.fields.lastMessageAt}</div>,
      cell: ({ row }) => {
        return <DateTimeDisplay dateString={row.getValue('lastMessageAt')} />;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <ConversationActionMenu
            conversation={row.original}
            onView={onViewConversation}
            onAbandon={onAbandonConversation}
          />
        );
      },
    },
  ];
}
