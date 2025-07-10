import { Injectable } from '@nestjs/common';
import { MessageMediaType } from '@shula/shared-queues';
import { ContextLogger } from 'nestjs-context-logger';
import { PrismaService } from '../../database/prisma.service';
import {
  GroupEventLogItem,
  GroupLogsResponseDto,
} from './dto/group-logs-response.dto';

// Define log event types
export enum GroupEventType {
  MESSAGE_PROCESSED = 'message_processed',
  MEDIA_PROCESSED = 'media_processed',
}

@Injectable()
export class GroupMetricsService {
  private readonly logger = new ContextLogger(GroupMetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log a message processing event
   * @param groupId - The group ID
   * @param metadata - Optional additional metadata
   */
  async logMessageProcessed(
    groupId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.prisma.groupEventLog.create({
        data: {
          groupId,
          eventType: GroupEventType.MESSAGE_PROCESSED,
          metadata: metadata ? metadata : undefined,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to log message processed event for group ${groupId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Log a media processing event
   * @param groupId - The group ID
   * @param mediaType - The type of media being processed
   * @param metadata - Optional additional metadata
   */
  async logMediaProcessed(
    groupId: string,
    mediaType: MessageMediaType,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.prisma.groupEventLog.create({
        data: {
          groupId,
          eventType: GroupEventType.MEDIA_PROCESSED,
          mediaType: mediaType.toString(),
          metadata: metadata ? metadata : undefined,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to log media processed event for group ${groupId} and media type ${mediaType}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Count messages processed for a group within a date range
   * @param groupId - The group ID
   * @param startDate - The start date for the range
   * @param endDate - The end date for the range
   */
  async countMessagesProcessed(
    groupId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      const where: any = {
        groupId,
        eventType: GroupEventType.MESSAGE_PROCESSED,
      };

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
          where.timestamp.gte = startDate;
        }
        if (endDate) {
          where.timestamp.lte = endDate;
        }
      }

      return await this.prisma.groupEventLog.count({
        where,
      });
    } catch (error) {
      this.logger.error(
        `Failed to count messages processed for group ${groupId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      return 0;
    }
  }

  /**
   * Count media processed for a group within a date range, optionally filtered by media type
   * @param groupId - The group ID
   * @param startDate - The start date for the range
   * @param endDate - The end date for the range
   * @param mediaType - Optional media type filter
   */
  async countMediaProcessed(
    groupId: string,
    startDate?: Date,
    endDate?: Date,
    mediaType?: MessageMediaType
  ) {
    try {
      const where: any = {
        groupId,
        eventType: GroupEventType.MEDIA_PROCESSED,
      };

      if (mediaType) {
        where.mediaType = mediaType.toString();
      }

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
          where.timestamp.gte = startDate;
        }
        if (endDate) {
          where.timestamp.lte = endDate;
        }
      }

      return await this.prisma.groupEventLog.count({
        where,
      });
    } catch (error) {
      this.logger.error(
        `Failed to count media processed for group ${groupId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      return 0;
    }
  }

  /**
   * Get media counts by type for a group within a date range
   * @param groupId - The group ID
   * @param startDate - The start date for the range
   * @param endDate - The end date for the range
   */
  async getMediaCountsByType(
    groupId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      const where: any = {
        groupId,
        eventType: GroupEventType.MEDIA_PROCESSED,
      };

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) {
          where.timestamp.gte = startDate;
        }
        if (endDate) {
          where.timestamp.lte = endDate;
        }
      }

      const mediaLogs = await this.prisma.groupEventLog.findMany({
        where,
        select: {
          mediaType: true,
        },
      });

      const counts: Record<MessageMediaType, number> & { total: number } = {
        [MessageMediaType.IMAGE]: 0,
        [MessageMediaType.VIDEO]: 0,
        [MessageMediaType.DOCUMENT]: 0,
        [MessageMediaType.AUDIO]: 0,
        [MessageMediaType.STICKER]: 0,
        [MessageMediaType.LOCATION]: 0,
        [MessageMediaType.CONTACT]: 0,
        total: mediaLogs.length,
      };

      // Count by media type
      mediaLogs.forEach((log) => {
        if (log.mediaType && log.mediaType in counts) {
          counts[log.mediaType as MessageMediaType]++;
        }
      });

      return counts;
    } catch (error) {
      this.logger.error(
        `Failed to get media counts by type for group ${groupId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      return {
        [MessageMediaType.IMAGE]: 0,
        [MessageMediaType.VIDEO]: 0,
        [MessageMediaType.DOCUMENT]: 0,
        [MessageMediaType.AUDIO]: 0,
        [MessageMediaType.STICKER]: 0,
        [MessageMediaType.LOCATION]: 0,
        [MessageMediaType.CONTACT]: 0,
        total: 0,
      };
    }
  }

  /**
   * Get message and media counts for the current month
   * @param groupId - The group ID
   */
  async getGroupMetricsForCurrentMonth(groupId: string) {
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month

      return this.getGroupMetricsForDateRange(groupId, startDate, now);
    } catch (error) {
      this.logger.error(
        `Failed to get current month metrics for group ${groupId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      return null;
    }
  }

  /**
   * Get message and media counts for the last 30 days
   * @param groupId - The group ID
   */
  async getGroupMetricsForLast30Days(groupId: string) {
    try {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - 30);

      return this.getGroupMetricsForDateRange(groupId, startDate, now);
    } catch (error) {
      this.logger.error(
        `Failed to get last 30 days metrics for group ${groupId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      return null;
    }
  }

  /**
   * Get message and media counts for a custom date range
   * @param groupId - The group ID
   * @param startDate - The start date for the range
   * @param endDate - The end date for the range
   */
  async getGroupMetricsForDateRange(
    groupId: string,
    startDate: Date,
    endDate: Date
  ) {
    try {
      const messageCount = await this.countMessagesProcessed(
        groupId,
        startDate,
        endDate
      );
      const mediaCounts = await this.getMediaCountsByType(
        groupId,
        startDate,
        endDate
      );

      return {
        groupId,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        messagesProcessed: messageCount,
        mediaProcessed: mediaCounts,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get metrics for date range for group ${groupId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      return null;
    }
  }

  /**
   * Query group event logs with pagination and filtering
   * @param groupId - The group ID
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   * @param filters - Optional filters (eventType, mediaType, startDate, endDate)
   */
  async queryGroupEventLogs(
    groupId: string,
    page = 1,
    limit = 10,
    filters?: {
      eventType?: GroupEventType;
      mediaType?: MessageMediaType;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<GroupLogsResponseDto> {
    try {
      const where: any = { groupId };
      const take = Math.max(1, limit);
      const skip = Math.max(0, (page - 1) * take);

      if (filters?.eventType) {
        where.eventType = filters.eventType;
      }

      if (filters?.mediaType) {
        where.mediaType = filters.mediaType.toString();
      }

      if (filters?.startDate || filters?.endDate) {
        where.timestamp = {};
        if (filters.startDate) {
          where.timestamp.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.timestamp.lte = filters.endDate;
        }
      }

      const [rawItems, total] = await Promise.all([
        this.prisma.groupEventLog.findMany({
          where,
          skip,
          take,
          orderBy: {
            timestamp: 'desc',
          },
        }),
        this.prisma.groupEventLog.count({ where }),
      ]);

      const items: GroupEventLogItem[] = rawItems.map((item) => ({
        id: item.id,
        groupId: item.groupId,
        eventType: item.eventType as GroupEventType,
        mediaType: item.mediaType
          ? (item.mediaType as MessageMediaType)
          : undefined,
        metadata: item.metadata as Record<string, unknown>,
        timestamp: item.timestamp,
      }));

      return {
        items,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to query event logs for group ${groupId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
      throw error;
    }
  }
}
