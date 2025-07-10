'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useActivateParticipant,
  useDeactivateParticipant,
  useDeleteParticipant,
  useParticipantsWithCounts,
  ParticipantWithCountsResponseDto,
} from '@/lib/hooks/use-participants';
import {
  Copy,
  MoreHorizontal,
  Search,
  User,
  Users,
  RefreshCw,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import he from '@/locales/he';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export function ParticipantsDataTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);

  // React Query hook with all parameters directly in the query
  const { data, isLoading, refetch } = useParticipantsWithCounts(
    page,
    pageSize,
    {
      name: searchTerm,
    }
  );

  const activateParticipantMutation = useActivateParticipant();
  const deactivateParticipantMutation = useDeactivateParticipant();
  const deleteParticipantMutation = useDeleteParticipant();

  // Handler for copying text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Handler for pagination changes with proper state management
  const handlePaginationChange = useCallback(
    (newPageIndex: number, newPageSize: number) => {
      // If page size changed, reset to first page
      if (pageSize !== newPageSize) {
        setPage(1);
        setPageSize(newPageSize);
      } else {
        // Otherwise just update the page (convert from 0-indexed to 1-indexed)
        setPage(newPageIndex + 1);
      }
    },
    [pageSize]
  );

  // Handler for search with proper reset to first page
  const handleSearch = (value: string) => {
    setSearchTerm(value.length > 0 ? value : undefined);
    setPage(1); // Reset to first page when searching
  };

  // Handler for activation
  const handleActivateParticipant = (id: string) => {
    activateParticipantMutation.mutate(id);
  };

  // Handler for deactivation
  const handleDeactivateParticipant = (id: string) => {
    deactivateParticipantMutation.mutate(id);
  };

  // Handler for deletion
  const handleDeleteParticipant = (id: string) => {
    deleteParticipantMutation.mutate(id);
  };

  // Handler for row click to navigate to participant detail page
  const handleRowClick = (row: ParticipantWithCountsResponseDto) => {
    router.push(`/dashboard/participants/${row.id}`);
  };

  // Define columns for the data table
  const columns: ColumnDef<ParticipantWithCountsResponseDto>[] = [
    {
      accessorKey: 'name',
      header: () => <div>{he.participants.fields.name}</div>,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-indigo-500" />
          <span className="font-medium">{row.getValue('name')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'phoneNumber',
      header: () => <div>{he.participants.fields.phoneNumber}</div>,
      cell: ({ row }) => {
        const phoneNumber = row.getValue('phoneNumber') as string;
        return (
          <div className="flex items-center gap-1">
            <span>{phoneNumber}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(phoneNumber);
                    }}
                    className="h-6 w-6 ms-1"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{he.participants.fields.copyPhone}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
    {
      accessorKey: 'groupsCount',
      header: () => <div>{he.groups.title}</div>,
      cell: ({ row }) => {
        const count = row.getValue('groupsCount') as number;
        return (
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-blue-500" />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'personsCount',
      header: () => <div>{he.participants.fields.personsCount}</div>,
      cell: ({ row }) => {
        const count = row.getValue('personsCount') as number;
        return (
          <div className="flex items-center gap-1">
            <User className="h-4 w-4 text-green-500" />
            <span>{count}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: () => <div>{he.participants.fields.status}</div>,
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge
            variant={status === 'active' ? 'default' : 'destructive'}
            className="px-2 py-0 text-xs"
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
      header: () => <div>{he.participants.fields.joinedAt}</div>,
      cell: ({ row }) => {
        const date = new Date(row.getValue('joinedAt') as string);
        return (
          <div className="text-sm">{date.toLocaleDateString('he-IL')}</div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div>{he.common.actions}</div>,
      cell: ({ row }) => {
        const participant = row.original;
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
                {participant.status === 'active' ? (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeactivateParticipant(participant.id);
                    }}
                  >
                    {he.common.deactivate}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleActivateParticipant(participant.id);
                    }}
                  >
                    {he.common.activate}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      {he.common.delete}
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {he.common.delete} {participant.name}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        האם אתה בטוח שברצונך למחוק את המשתתף {participant.name}?
                        פעולה זו אינה ניתנת לביטול.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{he.common.cancel}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteParticipant(participant.id);
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {he.common.delete}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-0 shadow-md">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-1.5"></div>
        <CardHeader className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight">
                {he.participants.title}
              </CardTitle>
              <p className="mt-2 text-sm text-muted-foreground">
                {data?.total
                  ? `${he.common.total}: ${data.total} ${he.participants.title}`
                  : he.common.loading}
              </p>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={he.participants.search.placeholder}
                value={searchTerm || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => refetch()}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>{he.common.refresh}</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.items || []}
        pageCount={data?.pages || 0}
        pageIndex={page - 1} // Convert from 1-indexed to 0-indexed for the DataTable
        pageSize={pageSize}
        onPaginationChange={handlePaginationChange}
        isPending={isLoading}
        onRowClick={handleRowClick}
      />
    </div>
  );
}
