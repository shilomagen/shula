import {
  getGroupConsentStatus,
  getParticipantConsentsByGroupId,
  updateParticipantConsent as updateParticipantConsentAction,
} from '@/lib/actions/participant-consents';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to fetch participant consents for a group
 * @param groupId Group ID
 * @param page Page number
 * @param size Page size
 * @returns Query result with participant consents data
 */
export function useParticipantConsentsByGroupId(
  groupId: string,
  page: number = 1,
  size: number = 10
) {
  return useQuery({
    queryKey: ['participant-consents', groupId, page, size],
    queryFn: () => getParticipantConsentsByGroupId(groupId),
    enabled: !!groupId,
  });
}

/**
 * Hook to fetch group consent status
 * @param groupId Group ID
 * @returns Query result with group consent status
 */
export function useGroupConsentStatus(groupId: string) {
  return useQuery({
    queryKey: ['group-consent-status', groupId],
    queryFn: () => getGroupConsentStatus(groupId),
    enabled: !!groupId,
  });
}

/**
 * Hook to update a participant's consent status
 * @returns Mutation for updating participant consent
 */
export function useUpdateParticipantConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      participantId,
      consentStatus,
    }: {
      groupId: string;
      participantId: string;
      consentStatus: string;
    }) => updateParticipantConsentAction(groupId, participantId, consentStatus),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ['participant-consents', variables.groupId],
      });
      queryClient.invalidateQueries({
        queryKey: ['group-consent-status', variables.groupId],
      });
    },
  });
}
