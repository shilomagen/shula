'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GroupsResponseDto } from '@/generated/http-clients/backend';
import { formatDate, truncateText } from '@/lib/utils';
import he from '@/locales/he';
import { ColumnDef } from '@tanstack/react-table';
import {
  CheckCircle,
  Copy,
  Edit,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Power,
  PowerOff,
  Trash,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { ConsentStatusCell } from './components/consent-status-cell';

export const columns: ColumnDef<GroupsResponseDto>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className="px-4">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="px-4">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 60,
  },
  {
    id: 'id',
    header: he.groups.fields.id,
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <div className="flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(id);
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span className="sr-only">Copy ID</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{he.common.copyId}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    },
    size: 60,
  },
  {
    accessorKey: 'name',
    header: he.groups.fields.name,
    cell: ({ row }) => {
      const name = row.getValue('name') as string;
      const id = row.original.id;

      return (
        <Link
          href={`/dashboard/groups/${id}`}
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center"
        >
          {name}
          <ExternalLink className="h-3 w-3 me-1" />
        </Link>
      );
    },
    size: 200,
  },
  {
    accessorKey: 'personsCount',
    header: he.persons.fields.personCount,
    cell: ({ row }) => {
      const personsCount = row.getValue('personsCount') as number;
      return (
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5 text-indigo-500" />
          <span>{personsCount || 0}</span>
        </div>
      );
    },
    size: 150,
  },
  {
    id: 'consentStatus',
    header: he.groups.fields.consentStatus,
    cell: ({ row }) => {
      const groupId = row.original.id;
      return <ConsentStatusCell groupId={groupId} />;
    },
    size: 150,
  },
  {
    accessorKey: 'description',
    header: he.groups.fields.description,
    cell: ({ row }) => {
      const description = row.getValue('description') as string;
      return (
        <div className="text-muted-foreground">
          {description ? truncateText(description, 30) : '-'}
        </div>
      );
    },
    size: 250,
  },
  {
    accessorKey: 'status',
    header: he.groups.fields.status,
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      return (
        <div className="flex w-full">
          {status === 'active' ? (
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              {he.groups.status.active}
            </Badge>
          ) : status === 'inactive' ? (
            <Badge
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1"
            >
              <XCircle className="h-3 w-3" />
              {he.groups.status.inactive}
            </Badge>
          ) : (
            <span>{status}</span>
          )}
        </div>
      );
    },
    size: 150,
  },
  {
    accessorKey: 'createdAt',
    header: he.groups.fields.createdAt,
    cell: ({ row }) => {
      return (
        <div className="text-muted-foreground text-sm">
          {formatDate(row.getValue('createdAt') as string)}
        </div>
      );
    },
    size: 150,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const group = row.original;
      const isActive = group.status === 'active';

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">{he.common.actions}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{he.common.actions}</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/groups/${group.id}`}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  {he.groups.actions.view}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                {he.groups.actions.edit}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isActive ? (
                <DropdownMenuItem className="flex items-center gap-2 text-amber-600">
                  <PowerOff className="h-4 w-4" />
                  {he.groups.actions.deactivate}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="flex items-center gap-2 text-green-600">
                  <Power className="h-4 w-4" />
                  {he.groups.actions.activate}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 text-red-600">
                <Trash className="h-4 w-4" />
                {he.groups.actions.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    size: 50,
  },
];
