'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  activateGroup,
  deactivateGroup,
  deleteGroup,
  getGroupStats,
  queryGroups,
  getParticipantsConsentStatus,
  getAllGroups,
  getAllGroupsWithCounts,
  getGroupById,
  getGroupsByParticipantId,
  getGroupWithCountsById,
} from '../actions/groups';
import { PaginatedGroupsResponseDto } from '@/generated/http-clients/backend';

// Query keys
export const groupsKeys = {
  all: ['groups'] as const,
  lists: () => [...groupsKeys.all, 'list'] as const,
  list: (filters: GroupsFilters) => [...groupsKeys.lists(), filters] as const,
  stats: () => [...groupsKeys.all, 'stats'] as const,
  details: () => [...groupsKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupsKeys.details(), id] as const,
};

// Types
export interface GroupsFilters {
  page: number;
  size: number;
  minParticipants?: number;
  maxParticipants?: number;
  name?: string;
}
// Hooks
export function useGroupsWithCounts(filters: GroupsFilters) {
  return useQuery<PaginatedGroupsResponseDto>({
    queryKey: groupsKeys.list(filters),
    queryFn: () =>
      queryGroups({
        page: filters.page,
        size: filters.size,
        minParticipants: filters.minParticipants,
        maxParticipants: filters.maxParticipants,
        name: filters.name,
      }),
  });
}

export function useGroupStats() {
  return useQuery({
    queryKey: groupsKeys.stats(),
    queryFn: () => getGroupStats(),
  });
}

export function useActivateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateGroup(id),
    onSuccess: () => {
      // Invalidate all group lists and stats
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupsKeys.stats() });
    },
  });
}

export function useDeactivateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateGroup(id),
    onSuccess: () => {
      // Invalidate all group lists and stats
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupsKeys.stats() });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      // Invalidate all group lists and stats
      queryClient.invalidateQueries({ queryKey: groupsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupsKeys.stats() });
    },
  });
}

export function useParticipantsConsentStatus(groupId: string) {
  return useQuery({
    queryKey: ['participantsConsentStatus', groupId],
    queryFn: () => getParticipantsConsentStatus(groupId),
    enabled: !!groupId,
  });
}

/**
 * Hook for fetching groups by participant ID
 * @param participantId The participant ID to fetch groups for
 * @param page Page number
 * @param size Number of items per page
 * @returns Query result with groups data
 */
export function useGroupsByParticipant(
  participantId: string,
  page = 1,
  size = 10
) {
  return useQuery({
    queryKey: [...groupsKeys.lists(), { participantId, page, size }],
    queryFn: () => getGroupsByParticipantId(participantId, page, size),
    enabled: !!participantId,
  });
}
