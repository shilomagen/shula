'use client';

import {
  ConversationResponseDto,
  MessageResponseDto,
  PaginatedConversationsResponseDto,
  UpdateConversationDto,
} from '@/generated/http-clients/backend/models';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  abandonConversation,
  getConversationById,
  getConversationMessages,
  getConversationsByParticipantId,
  sendMessage,
  getAllConversations,
  updateConversation,
} from '../actions/conversations';

// Query keys
export const conversationsKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationsKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...conversationsKeys.lists(), filters] as const,
  participantConversations: (participantId: string) =>
    [...conversationsKeys.lists(), { participantId }] as const,
  details: () => [...conversationsKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationsKeys.details(), id] as const,
  messages: () => [...conversationsKeys.all, 'messages'] as const,
  messagesForConversation: (id: string) =>
    [...conversationsKeys.messages(), id] as const,
  byParticipant: () => [...conversationsKeys.all, 'by-participant'] as const,
  byParticipantId: (participantId: string) =>
    [...conversationsKeys.byParticipant(), participantId] as const,
};

// Export the DTO types for use in components
export type {
  ConversationResponseDto,
  MessageResponseDto,
  PaginatedConversationsResponseDto,
};

/**
 * Hook for fetching all conversations with filtering and pagination
 */
export function useConversationsWithFilters(
  page: number = 1,
  size: number = 10,
  filters?: {
    participantName?: string;
    participantPhone?: string;
  }
) {
  return useQuery<PaginatedConversationsResponseDto>({
    queryKey: [...conversationsKeys.lists(), { page, size, ...filters }],
    queryFn: () =>
      getAllConversations(
        page,
        size,
        filters?.participantName,
        filters?.participantPhone
      ),
  });
}

// Other hooks
export function useConversationsByParticipantId(participantId: string) {
  return useQuery({
    queryKey: conversationsKeys.participantConversations(participantId),
    queryFn: () => getConversationsByParticipantId(participantId),
    enabled: !!participantId,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: conversationsKeys.detail(id),
    queryFn: () => getConversationById(id),
    enabled: !!id,
  });
}

export function useConversationMessages(id: string) {
  return useQuery({
    queryKey: conversationsKeys.messagesForConversation(id),
    queryFn: () => getConversationMessages(id),
    enabled: !!id,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function useAbandonConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => abandonConversation(id),
    onSuccess: (_, id) => {
      // Invalidate specific conversation and its messages
      queryClient.invalidateQueries({ queryKey: conversationsKeys.detail(id) });

      // Invalidate all conversation lists
      queryClient.invalidateQueries({ queryKey: conversationsKeys.lists() });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => sendMessage(conversationId, content),
    onSuccess: (_, { conversationId }) => {
      // Invalidate messages for this conversation
      queryClient.invalidateQueries({
        queryKey: conversationsKeys.messagesForConversation(conversationId),
      });
    },
  });
}

/**
 * Hook for updating a conversation
 */
export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConversationDto }) =>
      updateConversation(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific conversation and its messages
      queryClient.invalidateQueries({ queryKey: conversationsKeys.detail(id) });
    },
  });
}

/**
 * Hook for fetching conversations by participant ID
 * @param participantId The ID of the participant to fetch conversations for
 * @returns Query result with conversations data
 */
export function useConversationsByParticipant(participantId: string) {
  return useQuery({
    queryKey: conversationsKeys.byParticipantId(participantId),
    queryFn: () => getConversationsByParticipantId(participantId),
    enabled: !!participantId,
  });
}
