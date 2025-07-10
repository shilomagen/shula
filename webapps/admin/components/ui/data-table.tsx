'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  RowSelectionState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import he from '@/locales/he';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: (pageIndex: number, pageSize: number) => void;
  isPending?: boolean;
  searchColumn?: string;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  pageIndex = 0,
  pageSize = 10,
  onPaginationChange,
  isPending = false,
  searchColumn,
  searchPlaceholder,
  onSearch,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = React.useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
      globalFilter,
    },
    manualPagination: !!onPaginationChange,
    pageCount: pageCount,
    enableRowSelection: true,
  });

  // Handle pagination changes
  const handlePageChange = React.useCallback(
    (page: number) => {
      if (onPaginationChange) {
        onPaginationChange(page - 1, table.getState().pagination.pageSize);
      } else {
        table.setPageIndex(page - 1);
      }
    },
    [onPaginationChange, table]
  );

  // Handle page size changes
  const handlePageSizeChange = React.useCallback(
    (size: number) => {
      if (onPaginationChange) {
        onPaginationChange(0, size); // Reset to first page when changing page size
      } else {
        table.setPageSize(size);
      }
    },
    [onPaginationChange, table]
  );

  return (
    <div className="w-full space-y-4">
      {searchColumn && (
        <div className="flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder || he.common.search}
              value={
                (table.getColumn(searchColumn)?.getFilterValue() as string) ??
                ''
              }
              onChange={(event) => {
                const value = event.target.value;
                table.getColumn(searchColumn)?.setFilterValue(value);

                // If onSearch is provided, call it with the search value
                if (onSearch) {
                  onSearch(value);
                }
              }}
              className="pr-8 text-right"
            />
          </div>
          <div className="flex items-center gap-2">
            {table.getSelectedRowModel().rows.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-xs"
                onClick={() => setRowSelection({})}
              >
                {he.common.clearSelection}
              </Button>
            )}
            <div className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} {he.common.of}{' '}
              {table.getFilteredRowModel().rows.length} {he.common.rows}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border w-full overflow-hidden bg-white shadow-sm">
        <Table dir="rtl" className="border-collapse">
          <TableHeader className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="text-right py-3"
                      style={{
                        width: header.getSize(),
                        textAlign: 'right',
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex justify-center items-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full ml-2"></div>
                    {he.common.loading}
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={`hover:bg-muted/50 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                  onClick={(e) => {
                    // Only trigger row click if the click wasn't on an interactive element
                    const target = e.target as HTMLElement;
                    const isInteractiveElement =
                      target.closest('button') ||
                      target.closest('a') ||
                      target.closest('input') ||
                      target.closest('[role="button"]') ||
                      target.closest('[role="link"]');

                    if (onRowClick && !isInteractiveElement) {
                      onRowClick(row.original);
                      e.stopPropagation();
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="text-right py-3"
                      style={{
                        textAlign: 'right',
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {he.common.noData}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={pageIndex + 1}
        totalPages={pageCount || table.getPageCount() || 1}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isPending={isPending}
      />
    </div>
  );
}
