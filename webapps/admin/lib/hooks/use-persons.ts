'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPersonsByParticipant, deletePerson } from '@/lib/actions/persons';

// Query keys
export const personsKeys = {
  all: ['persons'] as const,
  byParticipant: () => [...personsKeys.all, 'by-participant'] as const,
  byParticipantId: (participantId: string) =>
    [...personsKeys.byParticipant(), participantId] as const,
};

/**
 * Hook for fetching persons by participant ID
 * @param participantId The ID of the participant to fetch persons for
 * @param xParticipantId The participant ID making the request (for auth)
 * @returns Query result with persons data
 */
export function usePersonsByParticipant(
  participantId: string,
  xParticipantId: string
) {
  return useQuery({
    queryKey: personsKeys.byParticipantId(participantId),
    queryFn: () => getPersonsByParticipant(xParticipantId, participantId),
    enabled: !!participantId && !!xParticipantId,
  });
}

/**
 * Hook for deleting a person
 * @param xParticipantId The participant ID making the request (for auth)
 * @param participantId The ID of the participant to invalidate data for after deletion
 * @returns Mutation result
 */
export function useDeletePerson(xParticipantId: string, participantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (personId: string) => deletePerson(xParticipantId, personId),
    onSuccess: () => {
      // Invalidate the persons query to refetch the data
      queryClient.invalidateQueries({
        queryKey: personsKeys.byParticipantId(participantId),
      });
    },
  });
}
