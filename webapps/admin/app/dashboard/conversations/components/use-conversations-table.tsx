'use client';

import { useCallback, useState } from 'react';
import {
  useAbandonConversation,
  useConversationsWithFilters,
} from '@/lib/hooks/use-conversations';
import { useRouter } from 'next/navigation';

export function useConversationsTable() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [nameFilter, setNameFilter] = useState<string | undefined>(undefined);
  const [phoneFilter, setPhoneFilter] = useState<string | undefined>(undefined);
  const router = useRouter();

  // React Query hook to get conversations with filters
  const { data, isLoading, refetch } = useConversationsWithFilters(
    page,
    pageSize,
    {
      participantName: nameFilter,
      participantPhone: phoneFilter,
    }
  );

  const abandonConversationMutation = useAbandonConversation();

  // Handler for searching by participant name
  const handleSearchByName = useCallback((value: string) => {
    setNameFilter(value.length > 0 ? value : undefined);
    setPage(1); // Reset to first page when searching
  }, []);

  // Handler for searching by participant phone
  const handleSearchByPhone = useCallback((value: string) => {
    setPhoneFilter(value.length > 0 ? value : undefined);
    setPage(1); // Reset to first page when searching
  }, []);

  // Handler for abandoning a conversation
  const handleAbandonConversation = useCallback(
    (id: string) => {
      abandonConversationMutation.mutate(id);
    },
    [abandonConversationMutation]
  );

  // Handler for viewing a conversation
  const handleViewConversation = useCallback(
    (id: string) => {
      router.push(`/dashboard/conversations/${id}`);
    },
    [router]
  );

  // Handler for pagination changes
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

  return {
    // State
    data: data?.items || [],
    pageCount: data?.pages || 0,
    pageIndex: page - 1, // Convert from 1-indexed to 0-indexed
    pageSize,
    isLoading,

    // Handlers
    handleSearchByName,
    handleSearchByPhone,
    handleAbandonConversation,
    handleViewConversation,
    handlePaginationChange,
    refetch,
  };
}
