'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Edit, MoreHorizontal, Trash } from 'lucide-react';
import he from '@/locales/he';
import { formatDate } from '@/lib/utils';
import { SystemMessageResponseDto } from '@/generated/http-clients/backend';

import { DataTable } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { EditMessageDialog } from './edit-message-dialog';
import { DeleteMessageDialog } from './delete-message-dialog';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SystemMessagesTableProps {
  searchTerm?: string;
  filteredMessages: SystemMessageResponseDto[];
  isLoading: boolean;
}

// Helper function to format content with newlines
const formatContent = (content: string) => {
  return content.split('\n').map((line, i) => (
    <span key={i} className="block">
      {line || ' '}
    </span>
  ));
};

export function SystemMessagesTable({
  searchTerm,
  filteredMessages,
  isLoading,
}: SystemMessagesTableProps) {
  const columns: ColumnDef<SystemMessageResponseDto>[] = [
    {
      accessorKey: 'id',
      header: he.systemMessages.fields.id,
      cell: ({ row }) => (
        <div className="max-w-[100px] truncate text-xs text-muted-foreground">
          {row.getValue('id')}
        </div>
      ),
    },
    {
      accessorKey: 'key',
      header: he.systemMessages.fields.key,
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('key')}</div>
      ),
    },
    {
      accessorKey: 'category',
      header: he.systemMessages.fields.category,
      cell: ({ row }) => {
        const category = row.getValue('category') as string;
        return (
          <Badge
            variant={
              category === 'GENERAL'
                ? 'default'
                : category === 'GROUP'
                ? 'secondary'
                : category === 'PERSON'
                ? 'outline'
                : 'destructive'
            }
            className="px-2 py-0 text-xs"
          >
            {category === 'GENERAL' && 'כללי'}
            {category === 'GROUP' && 'קבוצה'}
            {category === 'PERSON' && 'אדם'}
            {category === 'NOTIFICATION' && 'התראה'}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'content',
      header: he.systemMessages.fields.content,
      cell: ({ row }) => {
        const content = row.getValue('content') as string;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="max-w-[400px] max-h-[60px] overflow-hidden text-sm">
                  {formatContent(content)}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[400px] p-4">
                <div className="whitespace-pre-wrap text-sm">{content}</div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: he.systemMessages.fields.createdAt,
      cell: ({ row }) => formatDate(row.getValue('createdAt')),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const message = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{he.common.actions}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <EditMessageDialog message={message}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Edit className="ml-2 h-4 w-4" />
                  <span>{he.systemMessages.actions.edit}</span>
                </DropdownMenuItem>
              </EditMessageDialog>
              <DeleteMessageDialog
                message={message}
                trigger={({ onClick }) => (
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    onClick={onClick}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash className="ml-2 h-4 w-4" />
                    <span>{he.systemMessages.actions.delete}</span>
                  </DropdownMenuItem>
                )}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={filteredMessages}
      isPending={isLoading}
      searchColumn="key"
      searchPlaceholder={he.systemMessages.search.placeholder}
    />
  );
}
