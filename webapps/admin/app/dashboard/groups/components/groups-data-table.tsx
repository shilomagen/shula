'use client';

import { DataTable } from '@/components/ui/data-table';
import { createGroupColumns } from './groups-table-columns';
import { SearchFilters } from './search-filters';
import { useGroupsTable } from './use-groups-table';

export function GroupsDataTable() {
  const {
    data,
    pageCount,
    pageIndex,
    pageSize,
    isLoading,
    searchName,
    minParticipants,
    maxParticipants,
    handlePaginationChange,
    handleApplyFilters,
    handleClearFilters,
    handleActivateGroup,
    handleDeactivateGroup,
    handleDeleteGroup,
    handleSearchChange,
    handleRowClick,
    refetch,
    setMinParticipants,
    setMaxParticipants,
  } = useGroupsTable();

  const columns = createGroupColumns({
    onActivate: handleActivateGroup,
    onDeactivate: handleDeactivateGroup,
    onDelete: handleDeleteGroup,
  });

  return (
    <div className="space-y-4">
      <SearchFilters
        searchName={searchName}
        minParticipants={minParticipants}
        maxParticipants={maxParticipants}
        onSearchChange={handleSearchChange}
        onMinParticipantsChange={setMinParticipants}
        onMaxParticipantsChange={setMaxParticipants}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        onRefresh={refetch}
      />

      <DataTable
        columns={columns}
        data={data}
        pageCount={pageCount}
        pageIndex={pageIndex}
        pageSize={pageSize}
        onPaginationChange={handlePaginationChange}
        isPending={isLoading}
        onRowClick={(row) => handleRowClick(row.id)}
      />
    </div>
  );
}
