'use server';

import {
  GroupConsentStatusResponseDto,
  ParticipantConsentResponseDto,
  UpdateParticipantConsentDto,
  UpdateParticipantConsentDtoConsentStatusEnum,
} from '@/generated/http-clients/backend';
import { participantConsentsApi } from '@/lib/api-client';

/**
 * Get participant consents for a group
 * @param groupId Group ID
 * @param page Page number
 * @param size Page size
 * @returns Paginated list of participant consents
 */
export async function getParticipantConsentsByGroupId(
  groupId: string
): Promise<ParticipantConsentResponseDto[]> {
  try {
    const response = await participantConsentsApi.getConsentsByGroupId(groupId);
    return response.data;
  } catch (error) {
    console.error('Error fetching participant consents:', error);
    throw error;
  }
}

/**
 * Get consent status for a group
 * @param groupId Group ID
 * @returns Group consent status
 */
export async function getGroupConsentStatus(
  groupId: string
): Promise<GroupConsentStatusResponseDto> {
  try {
    const response = await participantConsentsApi.getGroupConsentStatus(
      groupId
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching group consent status:', error);
    throw error;
  }
}

/**
 * Update a participant's consent status
 * @param groupId Group ID
 * @param participantId Participant ID
 * @param consentStatus New consent status
 * @returns Updated consent record
 */
export async function updateParticipantConsent(
  groupId: string,
  participantId: string,
  consentStatus: string
): Promise<ParticipantConsentResponseDto> {
  try {
    // Convert string to enum value
    let statusEnum: UpdateParticipantConsentDtoConsentStatusEnum;

    switch (consentStatus) {
      case 'accepted':
        statusEnum = UpdateParticipantConsentDtoConsentStatusEnum.Accepted;
        break;
      case 'rejected':
        statusEnum = UpdateParticipantConsentDtoConsentStatusEnum.Rejected;
        break;
      default:
        statusEnum = UpdateParticipantConsentDtoConsentStatusEnum.Pending;
    }

    const updateDto: UpdateParticipantConsentDto = {
      consentStatus: statusEnum,
    };

    const response = await participantConsentsApi.updateConsentRecord(
      groupId,
      participantId,
      updateDto
    );
    return response.data;
  } catch (error) {
    console.error('Error updating participant consent:', error);
    throw error;
  }
}
