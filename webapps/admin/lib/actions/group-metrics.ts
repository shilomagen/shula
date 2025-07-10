'use server';

import {
  CountMediaProcessedMediaTypeEnum,
  GroupEventLogItemEventTypeEnum,
  GroupEventLogItemMediaTypeEnum,
  GroupLogsResponseDto,
  GroupMediaCountResponseDto,
  GroupMessagesCountResponseDto,
  GroupMetricsResponseDto,
} from '@/generated/http-clients/backend';
import { groupMetricsApi } from '@/lib/api-client';

/**
 * Get metrics for a group for the current month
 */
export async function getGroupMetricsForCurrentMonth(
  groupId: string
): Promise<GroupMetricsResponseDto> {
  try {
    const response = await groupMetricsApi.getGroupMetricsForCurrentMonth(
      groupId
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching current month metrics:', error);
    throw error;
  }
}

/**
 * Get metrics for a group for the last 30 days
 */
export async function getGroupMetricsForLast30Days(
  groupId: string
): Promise<GroupMetricsResponseDto> {
  try {
    const response = await groupMetricsApi.getGroupMetricsForLast30Days(
      groupId
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching last 30 days metrics:', error);
    throw error;
  }
}

/**
 * Get metrics for a group for a specific date range
 */
export async function getGroupMetricsForDateRange(
  groupId: string,
  startDate: string,
  endDate: string
): Promise<GroupMetricsResponseDto> {
  try {
    const response = await groupMetricsApi.getGroupMetricsForDateRange(
      groupId,
      startDate,
      endDate
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching date range metrics:', error);
    throw error;
  }
}

/**
 * Count messages processed for a group within a date range
 */
export async function countMessagesProcessed(
  groupId: string,
  startDate?: string,
  endDate?: string
): Promise<GroupMessagesCountResponseDto> {
  try {
    const response = await groupMetricsApi.countMessagesProcessed(
      groupId,
      startDate,
      endDate
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching message counts:', error);
    throw error;
  }
}

/**
 * Count media processed for a group within a date range
 */
export async function countMediaProcessed(
  groupId: string,
  startDate?: string,
  endDate?: string,
  mediaType?: CountMediaProcessedMediaTypeEnum
): Promise<GroupMediaCountResponseDto> {
  try {
    const response = await groupMetricsApi.countMediaProcessed(
      groupId,
      startDate,
      endDate,
      mediaType
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching media counts:', error);
    throw error;
  }
}

/**
 * Query group event logs with pagination and filters
 */
export async function queryGroupEventLogs(
  groupId: string,
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
  mediaType?: GroupEventLogItemMediaTypeEnum,
  eventType?: GroupEventLogItemEventTypeEnum
): Promise<GroupLogsResponseDto> {
  try {
    const response = await groupMetricsApi.getGroupLogs(
      groupId,
      endDate,
      startDate,
      mediaType,
      eventType,
      limit,
      page
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching group event logs:', error);
    // Return empty response on error
    return {
      items: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }
}
