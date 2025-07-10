'use server';

import { QueryParticipantsWithCountsStatusEnum } from '@/generated/http-clients/backend/api';
import { participantsApi } from '../api-client';

/**
 * Get all participants, optionally filtering by group ID
 * @param groupId Optional group ID to filter by
 * @returns Array of participants
 */
export async function getAllParticipants(groupId?: string) {
  try {
    const response = await participantsApi.getAllParticipants(groupId);
    return response.data;
  } catch (error) {
    console.error('Error fetching participants:', error);
    throw error;
  }
}

/**
 * Get a participant by ID
 * @param id Participant ID
 * @returns Participant data
 */
export async function getParticipantById(id: string) {
  try {
    const response = await participantsApi.getParticipantById(id);
    return response.data;
  } catch (error) {
    console.error(`Error fetching participant ${id}:`, error);
    throw error;
  }
}

/**
 * Get the context for a participant
 * @param id Participant ID
 * @returns Participant context data
 */
export async function getParticipantContext(id: string) {
  try {
    const response = await participantsApi.getParticipantContext(id);
    return response.data;
  } catch (error) {
    console.error(`Error fetching participant context ${id}:`, error);
    throw error;
  }
}

/**
 * Activate a participant
 * @param id Participant ID
 * @returns Updated participant data
 */
export async function activateParticipant(id: string) {
  try {
    const response = await participantsApi.updateParticipantStatus(id, {
      status: 'active',
    });
    return response.data;
  } catch (error) {
    console.error(`Error activating participant ${id}:`, error);
    throw error;
  }
}

/**
 * Deactivate a participant
 * @param id Participant ID
 * @returns Updated participant data
 */
export async function deactivateParticipant(id: string) {
  try {
    const response = await participantsApi.updateParticipantStatus(id, {
      status: 'inactive',
    });
    return response.data;
  } catch (error) {
    console.error(`Error deactivating participant ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a participant
 * @param id Participant ID
 * @returns Deleted participant data
 */
export async function deleteParticipant(id: string) {
  try {
    const response = await participantsApi.deleteParticipant(id);
    return response.data;
  } catch (error) {
    console.error(`Error deleting participant ${id}:`, error);
    throw error;
  }
}

/**
 * Query participants with counts for groups and persons with pagination and filtering
 * @param page Page number (1-indexed)
 * @param size Number of items per page
 * @param name Optional name filter
 * @param phoneNumber Optional phone number filter
 * @param status Optional status filter
 * @returns Paginated list of participants with counts
 */
export async function queryParticipantsWithCounts(
  page: number = 1,
  size: number = 10,
  name?: string,
  phoneNumber?: string,
  status?: QueryParticipantsWithCountsStatusEnum
) {
  try {
    const response = await participantsApi.queryParticipantsWithCounts(
      page,
      size,
      name,
      phoneNumber,
      status
    );
    return response.data;
  } catch (error) {
    console.error('Error querying participants with counts:', error);
    throw error;
  }
}
