'use client';

import { DataTable } from '@/components/ui/data-table';
import { getConversationsTableColumns } from './conversations-table-columns';
import { SearchFilters } from './search-filters';
import { useConversationsTable } from './use-conversations-table';

/**
 * ConversationsDataTable is a component for displaying and managing conversation data
 * It's been refactored to use smaller, more focused components for better maintainability
 */
export function ConversationsDataTable() {
  const {
    data,
    pageCount,
    pageIndex,
    pageSize,
    isLoading,
    handleSearchByName,
    handleSearchByPhone,
    handleAbandonConversation,
    handleViewConversation,
    handlePaginationChange,
    refetch,
  } = useConversationsTable();

  // Get the table columns with required handlers
  const columns = getConversationsTableColumns({
    onViewConversation: handleViewConversation,
    onAbandonConversation: handleAbandonConversation,
  });

  return (
    <div className="space-y-4">
      <SearchFilters
        onNameFilterChange={handleSearchByName}
        onPhoneFilterChange={handleSearchByPhone}
        onRefresh={refetch}
      />

      <div className="rounded-md border shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          pageCount={pageCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPaginationChange={handlePaginationChange}
          isPending={isLoading}
          onRowClick={(row) => handleViewConversation(row.id)}
        />
      </div>
    </div>
  );
}
