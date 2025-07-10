'use server';

import { groupsApi } from '@/lib/api-client';
import {
  GroupWithCountsResponseDto,
  GroupStatsResponseDto,
  GroupsResponseDto,
} from '@/generated/http-clients/backend';
import { participantConsentsApi } from '@/lib/api-client';

/**
 * Get all groups with pagination
 */
export async function getAllGroups(page = 1, size = 10) {
  const response = await groupsApi.getAllGroups(page, size);

  // The API returns items as Array<string> but they are actually GroupsResponseDto objects
  // We need to cast them to the correct type
  const typedResponse = {
    ...response.data,
    items: response.data.items as unknown as GroupsResponseDto[],
  };

  return typedResponse;
}

/**
 * Get all groups with counts and filters
 */
export async function getAllGroupsWithCounts(
  page = 1,
  size = 10,
  minParticipants?: number,
  maxParticipants?: number,
  name?: string
) {
  const response = await groupsApi.getAllGroupsWithCounts(
    page,
    size,
    minParticipants,
    maxParticipants,
    name
  );

  const typedResponse = {
    ...response.data,
    items: response.data.items as unknown as GroupWithCountsResponseDto[],
  };

  return typedResponse;
}

/**
 * Get group statistics
 */
export async function getGroupStats() {
  const response = await groupsApi.getGroupStats();
  return response.data as GroupStatsResponseDto;
}

/**
 * Get a group by ID
 */
export async function getGroupById(id: string) {
  const response = await groupsApi.getGroupById(id);
  return response.data;
}

/**
 * Get a group with counts by ID
 */
export async function getGroupWithCountsById(id: string) {
  const response = await groupsApi.getGroupWithCountsById(id);
  return response.data as GroupWithCountsResponseDto;
}

/**
 * Activate a group
 */
export async function activateGroup(id: string) {
  const response = await groupsApi.activateGroup(id);
  return response.data;
}

/**
 * Deactivate a group
 */
export async function deactivateGroup(id: string) {
  const response = await groupsApi.deactivateGroup(id);
  return response.data;
}

/**
 * Delete a group
 */
export async function deleteGroup(id: string) {
  await groupsApi.deleteGroup(id);
}

/**
 * Query groups with filters
 */
export async function queryGroups(queryParams: {
  page?: number;
  size?: number;
  minParticipants?: number;
  maxParticipants?: number;
  name?: string;
}) {
  // Use the generated API client method
  const response = await groupsApi.queryGroups({
    page: queryParams.page || 1,
    size: queryParams.size || 10,
    minParticipants: queryParams.minParticipants,
    maxParticipants: queryParams.maxParticipants,
    name: queryParams.name,
  });

  const typedResponse = {
    ...response.data,
    items: response.data.items as unknown as GroupWithCountsResponseDto[],
  };

  return typedResponse;
}

export async function getParticipantsConsentStatus(groupId: string) {
  'use server';

  try {
    const response = await participantConsentsApi.getParticipantsConsentStatus(
      groupId
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching participants consent status:', error);
    throw new Error('Failed to fetch participants consent status');
  }
}

/**
 * Get groups by participant ID using queryGroups API
 * @param participantId The participant ID to filter groups by
 * @param page Page number
 * @param size Number of items per page
 * @returns Paginated list of groups that the participant belongs to
 */
export async function getGroupsByParticipantId(
  participantId: string,
  page = 1,
  size = 10
) {
  try {
    // Use queryGroups with participantId filter
    const response = await groupsApi.queryGroups({
      participantId,
      page,
      size,
    });

    // The API returns items as Array<string> but they are actually GroupWithCountsResponseDto objects
    // We need to cast them to the correct type
    const typedResponse = {
      ...response.data,
      items: response.data.items as unknown as GroupWithCountsResponseDto[],
    };

    return typedResponse;
  } catch (error) {
    console.error(
      `Error fetching groups for participant ${participantId}:`,
      error
    );
    throw error;
  }
}
