import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import he from '@/locales/he';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isPending?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isPending = false,
}: PaginationProps) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Handle page change with validation
  const handlePageChange = (page: number) => {
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    onPageChange(page);
  };

  // Handle page size change
  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newSize = Number(event.target.value);
    if (newSize !== pageSize) {
      onPageSizeChange(newSize);
    }
  };

  return (
    <div className="flex items-center justify-between py-4" dir="rtl">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!canGoPrevious || isPending}
          className="h-8 w-8 p-0 flex items-center justify-center"
        >
          <ChevronDown className="h-4 w-4 -rotate-90" />
          <span className="sr-only">{he.common.previous}</span>
        </Button>
        <div className="text-sm text-muted-foreground">
          {he.common.page} {currentPage} {he.common.of} {totalPages || 1}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!canGoNext || isPending}
          className="h-8 w-8 p-0 flex items-center justify-center"
        >
          <ChevronDown className="h-4 w-4 rotate-90" />
          <span className="sr-only">{he.common.next}</span>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {he.common.rowsPerPage}
        </span>
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          className="h-8 w-16 rounded-md border border-input bg-background px-2 text-sm"
          disabled={isPending}
        >
          {[10, 20, 30, 40, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
