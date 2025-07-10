import { Controller, Get, Param, Query } from '@nestjs/common';
import { GroupMetricsService } from './group-metrics.service';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MessageMediaType } from '@shula/shared-queues';
import { GroupEventType } from './group-metrics.service';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { GroupLogsResponseDto } from './dto/group-logs-response.dto';
import {
  GroupMetricsResponseDto,
  GroupMessagesCountResponseDto,
  GroupMediaCountResponseDto,
} from './dto/group-metrics-response.dto';

class QueryGroupLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit = 10;

  @IsOptional()
  @IsEnum(GroupEventType)
  eventType?: GroupEventType;

  @IsOptional()
  @IsEnum(MessageMediaType)
  mediaType?: MessageMediaType;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

@ApiTags('group-metrics')
@Controller('group-metrics')
export class GroupMetricsController {
  constructor(private readonly groupMetricsService: GroupMetricsService) {}

  @Get(':groupId/current-month')
  @ApiOperation({
    summary: 'Get metrics for a group for the current month',
    operationId: 'getGroupMetricsForCurrentMonth',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved group metrics for current month',
    type: GroupMetricsResponseDto,
  })
  @ApiParam({ name: 'groupId', description: 'The group ID' })
  async getGroupMetricsForCurrentMonth(
    @Param('groupId') groupId: string
  ): Promise<GroupMetricsResponseDto | null> {
    return this.groupMetricsService.getGroupMetricsForCurrentMonth(groupId);
  }

  @Get(':groupId/last-30-days')
  @ApiOperation({
    summary: 'Get metrics for a group for the last 30 days',
    operationId: 'getGroupMetricsForLast30Days',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved group metrics for last 30 days',
    type: GroupMetricsResponseDto,
  })
  @ApiParam({ name: 'groupId', description: 'The group ID' })
  async getGroupMetricsForLast30Days(
    @Param('groupId') groupId: string
  ): Promise<GroupMetricsResponseDto | null> {
    return this.groupMetricsService.getGroupMetricsForLast30Days(groupId);
  }

  @Get(':groupId/date-range')
  @ApiOperation({
    summary: 'Get metrics for a group for a date range',
    operationId: 'getGroupMetricsForDateRange',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved group metrics for date range',
    type: GroupMetricsResponseDto,
  })
  @ApiParam({ name: 'groupId', description: 'The group ID' })
  @ApiQuery({ name: 'startDate', description: 'The start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', description: 'The end date (YYYY-MM-DD)' })
  async getGroupMetricsForDateRange(
    @Param('groupId') groupId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<GroupMetricsResponseDto | null> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.groupMetricsService.getGroupMetricsForDateRange(
      groupId,
      start,
      end
    );
  }

  @Get(':groupId/messages')
  @ApiOperation({
    summary: 'Count messages processed for a group within a date range',
    operationId: 'countMessagesProcessed',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved message count',
    type: GroupMessagesCountResponseDto,
  })
  @ApiParam({ name: 'groupId', description: 'The group ID' })
  @ApiQuery({
    name: 'startDate',
    description: 'The start date (YYYY-MM-DD)',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'The end date (YYYY-MM-DD)',
    required: false,
  })
  async countMessagesProcessed(
    @Param('groupId') groupId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<GroupMessagesCountResponseDto> {
    return {
      groupId,
      messagesCount: await this.groupMetricsService.countMessagesProcessed(
        groupId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      ),
      period: {
        startDate: startDate || 'all-time',
        endDate: endDate || 'present',
      },
    };
  }

  @Get(':groupId/media')
  @ApiOperation({
    summary: 'Count media processed for a group within a date range',
    operationId: 'countMediaProcessed',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved media count',
    type: GroupMediaCountResponseDto,
  })
  @ApiParam({ name: 'groupId', description: 'The group ID' })
  @ApiQuery({
    name: 'startDate',
    description: 'The start date (YYYY-MM-DD)',
    required: false,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'The end date (YYYY-MM-DD)',
    required: false,
  })
  @ApiQuery({
    name: 'mediaType',
    description: 'Media type filter (IMAGE, VIDEO, DOCUMENT, AUDIO)',
    required: false,
    enum: MessageMediaType,
  })
  async countMediaProcessed(
    @Param('groupId') groupId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('mediaType') mediaType?: MessageMediaType
  ): Promise<GroupMediaCountResponseDto> {
    if (mediaType) {
      return {
        groupId,
        mediaType,
        count: await this.groupMetricsService.countMediaProcessed(
          groupId,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined,
          mediaType
        ),
        period: {
          startDate: startDate || 'all-time',
          endDate: endDate || 'present',
        },
      };
    } else {
      return {
        groupId,
        mediaCounts: await this.groupMetricsService.getMediaCountsByType(
          groupId,
          startDate ? new Date(startDate) : undefined,
          endDate ? new Date(endDate) : undefined
        ),
        period: {
          startDate: startDate || 'all-time',
          endDate: endDate || 'present',
        },
      };
    }
  }

  @Get(':groupId/logs')
  @ApiOperation({
    summary: 'Get group logs',
    description: 'Get logs for a specific group with optional filters',
    operationId: 'getGroupLogs',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    required: true,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
  })
  @ApiQuery({
    name: 'eventType',
    required: false,
    enum: GroupEventType,
    description: 'Filter by event type',
  })
  @ApiQuery({
    name: 'mediaType',
    required: false,
    enum: MessageMediaType,
    description: 'Filter by media type',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Start date for filtering (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'End date for filtering (ISO format)',
  })
  @ApiResponse({
    status: 200,
    description: 'Group logs retrieved successfully',
    type: GroupLogsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async getGroupLogs(
    @Param('groupId') groupId: string,
    @Query() query: QueryGroupLogsDto
  ): Promise<GroupLogsResponseDto> {
    return this.groupMetricsService.queryGroupEventLogs(
      groupId,
      query.page,
      query.limit,
      {
        eventType: query.eventType,
        mediaType: query.mediaType,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined,
      }
    );
  }

  @Get(':groupId/metrics')
  @ApiOperation({
    summary: 'Get group metrics',
    description: 'Get metrics for a specific group',
    operationId: 'getGroupMetrics',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Group metrics retrieved successfully',
    type: GroupMetricsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async getGroupMetrics(
    @Param('groupId') groupId: string
  ): Promise<GroupMetricsResponseDto> {
    const metrics =
      await this.groupMetricsService.getGroupMetricsForCurrentMonth(groupId);
    if (!metrics) {
      return {
        groupId,
        period: {
          startDate: new Date().toISOString(),
          endDate: new Date().toISOString(),
        },
        messagesProcessed: 0,
        mediaProcessed: {
          [MessageMediaType.IMAGE]: 0,
          [MessageMediaType.VIDEO]: 0,
          [MessageMediaType.DOCUMENT]: 0,
          [MessageMediaType.AUDIO]: 0,
          [MessageMediaType.STICKER]: 0,
          [MessageMediaType.LOCATION]: 0,
          [MessageMediaType.CONTACT]: 0,
          total: 0,
        },
      };
    }
    return metrics;
  }

  @Get(':groupId/messages/count')
  @ApiOperation({
    summary: 'Get group message count',
    description: 'Get message count statistics for a specific group',
    operationId: 'getGroupMessagesCount',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Group message count retrieved successfully',
    type: GroupMessagesCountResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async getGroupMessagesCount(
    @Param('groupId') groupId: string
  ): Promise<GroupMessagesCountResponseDto> {
    const count = await this.groupMetricsService.countMessagesProcessed(
      groupId
    );
    return {
      groupId,
      messagesCount: count,
      period: {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      },
    };
  }

  @Get(':groupId/media/count')
  @ApiOperation({
    summary: 'Get group media count',
    description: 'Get media count statistics for a specific group',
    operationId: 'getGroupMediaCount',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Group media count retrieved successfully',
    type: GroupMediaCountResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async getGroupMediaCount(
    @Param('groupId') groupId: string
  ): Promise<GroupMediaCountResponseDto> {
    const mediaCounts = await this.groupMetricsService.getMediaCountsByType(
      groupId
    );
    return {
      groupId,
      mediaCounts,
      period: {
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      },
    };
  }
}
