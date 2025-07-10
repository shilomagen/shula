'use client';

import {
  useActivateGroup,
  useDeactivateGroup,
  useDeleteGroup,
  useGroupsWithCounts,
} from '@/lib/hooks/use-groups';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export function useGroupsTable() {
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [minParticipants, setMinParticipants] = useState<number | undefined>(
    undefined
  );
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>(
    undefined
  );
  const [searchName, setSearchName] = useState<string | undefined>(undefined);

  // React Query hooks
  const { data, isLoading, refetch } = useGroupsWithCounts({
    page: pageIndex + 1,
    size: pageSize,
    minParticipants,
    maxParticipants,
    name: searchName,
  });

  const activateGroupMutation = useActivateGroup();
  const deactivateGroupMutation = useDeactivateGroup();
  const deleteGroupMutation = useDeleteGroup();

  // Handler for copying text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Handler for pagination changes
  const handlePaginationChange = useCallback(
    (newPageIndex: number, newPageSize: number) => {
      setPageIndex(newPageIndex);
      if (pageSize !== newPageSize) {
        setPageSize(newPageSize);
      }
    },
    [pageSize]
  );

  // Handler for applying filters
  const handleApplyFilters = () => {
    refetch();
  };

  // Handler for clearing filters
  const handleClearFilters = () => {
    setMinParticipants(undefined);
    setMaxParticipants(undefined);
  };

  // Handler for group activation
  const handleActivateGroup = (id: string) => {
    activateGroupMutation.mutate(id);
  };

  // Handler for group deactivation
  const handleDeactivateGroup = (id: string) => {
    deactivateGroupMutation.mutate(id);
  };

  // Handler for group deletion
  const handleDeleteGroup = (id: string) => {
    deleteGroupMutation.mutate(id);
  };

  // Handler for search by name
  const handleSearchChange = (value: string | undefined) => {
    setSearchName(value);
    setPageIndex(0); // Reset to first page when searching
  };

  // Handler for row click - navigate to group detail page
  const handleRowClick = (id: string) => {
    router.push(`/dashboard/groups/${id}`);
  };

  // Effect to reset page index when filters change
  useEffect(() => {
    setPageIndex(0);
  }, [minParticipants, maxParticipants, searchName]);

  return {
    data: data?.items ?? [],
    pageCount: data?.pages ?? 1,
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
  };
}
