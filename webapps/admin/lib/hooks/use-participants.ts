'use client';

import {
  PaginatedParticipantsWithCountsResponseDto,
  ParticipantWithCountsResponseDto,
} from '@/generated/http-clients/backend/models';
import { QueryParticipantsWithCountsStatusEnum } from '@/generated/http-clients/backend/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  activateParticipant,
  deactivateParticipant,
  deleteParticipant,
  getAllParticipants,
  getParticipantById,
  getParticipantContext,
  queryParticipantsWithCounts,
} from '../actions/participants';

// Query keys
export const participantsKeys = {
  all: ['participants'] as const,
  lists: () => [...participantsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...participantsKeys.lists(), filters] as const,
  details: () => [...participantsKeys.all, 'detail'] as const,
  detail: (id: string) => [...participantsKeys.details(), id] as const,
  contexts: () => [...participantsKeys.all, 'context'] as const,
  context: (id: string) => [...participantsKeys.contexts(), id] as const,
};

// Export the DTO type for use in components
export type { ParticipantWithCountsResponseDto };

// Hooks
export function useParticipants(groupId?: string) {
  return useQuery({
    queryKey: groupId
      ? [...participantsKeys.lists(), { groupId }]
      : participantsKeys.lists(),
    queryFn: () => getAllParticipants(groupId),
  });
}

export function useParticipantsWithCounts(
  page: number = 1,
  size: number = 10,
  filters?: {
    name?: string;
    phoneNumber?: string;
    status?: QueryParticipantsWithCountsStatusEnum;
  }
) {
  return useQuery<PaginatedParticipantsWithCountsResponseDto>({
    queryKey: [
      ...participantsKeys.lists(),
      'withCounts',
      { page, size, ...filters },
    ],
    queryFn: () =>
      queryParticipantsWithCounts(
        page,
        size,
        filters?.name,
        filters?.phoneNumber,
        filters?.status
      ),
  });
}

export function useParticipant(id: string) {
  return useQuery({
    queryKey: participantsKeys.detail(id),
    queryFn: () => getParticipantById(id),
    enabled: !!id,
  });
}

export function useParticipantContext(id: string) {
  return useQuery({
    queryKey: participantsKeys.context(id),
    queryFn: () => getParticipantContext(id),
    enabled: !!id,
  });
}

export function useActivateParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activateParticipant(id),
    onSuccess: () => {
      // Invalidate all participant lists and contexts
      queryClient.invalidateQueries({ queryKey: participantsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: participantsKeys.contexts() });
    },
  });
}

export function useDeactivateParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivateParticipant(id),
    onSuccess: () => {
      // Invalidate all participant lists and contexts
      queryClient.invalidateQueries({ queryKey: participantsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: participantsKeys.contexts() });
    },
  });
}

export function useDeleteParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteParticipant(id),
    onSuccess: () => {
      // Invalidate all participant lists and contexts
      queryClient.invalidateQueries({ queryKey: participantsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: participantsKeys.contexts() });
    },
  });
}
