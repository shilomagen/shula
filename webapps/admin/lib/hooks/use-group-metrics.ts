'use client';

import {
  GroupEventLogItemEventTypeEnum,
  GroupEventLogItemMediaTypeEnum,
  GroupLogsResponseDto,
} from '@/generated/http-clients/backend';
import { useQuery } from '@tanstack/react-query';
import {
  getGroupMetricsForCurrentMonth,
  getGroupMetricsForDateRange,
  getGroupMetricsForLast30Days,
  queryGroupEventLogs,
} from '../actions/group-metrics';

interface MetricsOptions {
  enabled?: boolean;
}

// Group metrics query keys
export const groupMetricsKeys = {
  all: ['group-metrics'] as const,
  metrics: (groupId: string) => [...groupMetricsKeys.all, groupId] as const,
  messages: (groupId: string, startDate?: string, endDate?: string) =>
    [
      ...groupMetricsKeys.metrics(groupId),
      'messages',
      startDate,
      endDate,
    ] as const,
  media: (
    groupId: string,
    startDate?: string,
    endDate?: string,
    mediaType?: string
  ) =>
    [
      ...groupMetricsKeys.metrics(groupId),
      'media',
      startDate,
      endDate,
      mediaType,
    ] as const,
  currentMonth: (groupId: string) =>
    [...groupMetricsKeys.metrics(groupId), 'current-month'] as const,
  last30Days: (groupId: string) =>
    [...groupMetricsKeys.metrics(groupId), 'last-30-days'] as const,
  dateRange: (groupId: string, startDate: string, endDate: string) =>
    [
      ...groupMetricsKeys.metrics(groupId),
      'date-range',
      startDate,
      endDate,
    ] as const,
  eventLogs: (
    groupId: string,
    page?: number,
    limit?: number,
    startDate?: string,
    endDate?: string,
    mediaType?: string,
    eventType?: string
  ) =>
    [
      ...groupMetricsKeys.metrics(groupId),
      'event-logs',
      page,
      limit,
      startDate,
      endDate,
      mediaType,
      eventType,
    ] as const,
};

/**
 * Hook for getting message metrics for a group
 */
export function useGroupMessageMetrics(
  groupId: string,
  startDate?: string,
  endDate?: string,
  options: MetricsOptions = {}
) {
  return useQuery({
    queryKey: groupMetricsKeys.messages(groupId, startDate, endDate),
    queryFn: async () => {
      try {
        console.log(`Would fetch message metrics for group ${groupId}`);
        return Promise.resolve();
      } catch (error) {
        console.error('Error in useGroupMessageMetrics hook:', error);
        return Promise.resolve();
      }
    },
    enabled: !!groupId && options.enabled !== false,
  });
}

/**
 * Hook for getting media metrics for a group
 */
export function useGroupMediaMetrics(
  groupId: string,
  startDate?: string,
  endDate?: string,
  mediaType?: string,
  options: MetricsOptions = {}
) {
  return useQuery({
    queryKey: groupMetricsKeys.media(groupId, startDate, endDate, mediaType),
    queryFn: async () => {
      try {
        // For now we'll bypass the actual API call since it's causing type issues
        console.log(`Would fetch media metrics for group ${groupId}`);
        return Promise.resolve();
      } catch (error) {
        console.error('Error in useGroupMediaMetrics hook:', error);
        return Promise.resolve();
      }
    },
    enabled: !!groupId && options.enabled !== false,
  });
}

/**
 * Hook for getting metrics for a group for the last 30 days
 */
export function useGroupMetricsForLast30Days(
  groupId: string,
  options: MetricsOptions = {}
) {
  return useQuery({
    queryKey: groupMetricsKeys.last30Days(groupId),
    queryFn: () => getGroupMetricsForLast30Days(groupId),
    enabled: !!groupId && options.enabled !== false,
  });
}

/**
 * Hook for getting metrics for a group for the current month
 */
export function useGroupMetricsForCurrentMonth(
  groupId: string,
  options: MetricsOptions = {}
) {
  return useQuery({
    queryKey: groupMetricsKeys.currentMonth(groupId),
    queryFn: () => getGroupMetricsForCurrentMonth(groupId),
    enabled: !!groupId && options.enabled !== false,
  });
}

/**
 * Hook for getting metrics for a group for a specific date range
 */
export function useGroupMetricsForDateRange(
  groupId: string,
  startDate: string,
  endDate: string,
  options: MetricsOptions = {}
) {
  return useQuery({
    queryKey: groupMetricsKeys.dateRange(groupId, startDate, endDate),
    queryFn: () => getGroupMetricsForDateRange(groupId, startDate, endDate),
    enabled: !!groupId && !!startDate && !!endDate && options.enabled !== false,
  });
}

/**
 * Hook for querying group event logs with pagination and filters
 */
export function useGroupEventLogs(
  groupId: string,
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
  mediaType?: GroupEventLogItemMediaTypeEnum,
  eventType?: GroupEventLogItemEventTypeEnum,
  options: MetricsOptions = {}
) {
  return useQuery<GroupLogsResponseDto>({
    queryKey: groupMetricsKeys.eventLogs(
      groupId,
      page,
      limit,
      startDate,
      endDate,
      mediaType,
      eventType
    ),
    queryFn: () =>
      queryGroupEventLogs(
        groupId,
        page,
        limit,
        startDate,
        endDate,
        mediaType,
        eventType
      ),
    enabled: !!groupId && options.enabled !== false,
  });
}
