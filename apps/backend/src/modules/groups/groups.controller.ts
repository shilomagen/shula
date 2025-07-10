import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { GroupsCreateDto } from './dto/groups-create.dto';
import { GroupsResponseDto } from './dto/groups-response.dto';
import { GroupsUpdateDto } from './dto/groups-update.dto';
import { GroupsService } from './groups.service';
import { GroupStatsResponseDto } from './dto/group-stats-response.dto';
import { GroupWithCountsResponseDto } from './dto/group-with-counts-response.dto';
import { GroupsQueryDto } from './dto/groups-query.dto';
import { ConsentMessageDto } from './dto/consent-message-dto';
import { PaginatedGroupsResponseDto } from './dto/paginated-groups-response.dto';
import { PaginatedGroupsWithCountsResponseDto } from './dto/paginated-groups-with-counts-response.dto';

@ApiTags('groups')
@Controller('v1/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Get group statistics',
    description: 'Retrieve statistics about groups like active/inactive counts',
    operationId: 'getGroupStats',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Group statistics',
    type: GroupStatsResponseDto,
  })
  async getStats(): Promise<GroupStatsResponseDto> {
    return this.groupsService.getStats();
  }

  @Get('with-counts')
  @ApiOperation({
    summary: 'List all groups with participant and person counts',
    description:
      'Retrieve a list of all WhatsApp groups with participant and person counts',
    operationId: 'getAllGroupsWithCounts',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of groups with counts',
    type: PaginatedGroupsWithCountsResponseDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-indexed)',
    type: Number,
  })
  @ApiQuery({
    name: 'size',
    required: false,
    description: 'Number of items per page',
    type: Number,
  })
  @ApiQuery({
    name: 'minParticipants',
    required: false,
    description: 'Minimum number of participants',
    type: Number,
  })
  @ApiQuery({
    name: 'maxParticipants',
    required: false,
    description: 'Maximum number of participants',
    type: Number,
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Filter groups by name (case-insensitive partial match)',
    type: String,
  })
  @ApiQuery({
    name: 'participantId',
    required: false,
    description: 'Filter groups by participant ID',
    type: String,
  })
  async findAllWithCounts(
    @Query() pagination: PaginationDto,
    @Query('minParticipants') minParticipants?: number,
    @Query('maxParticipants') maxParticipants?: number,
    @Query('name') name?: string,
    @Query('participantId') participantId?: string
  ): Promise<PaginatedResponseDto<GroupWithCountsResponseDto>> {
    return this.groupsService.findAllWithCounts(pagination, {
      minParticipants,
      maxParticipants,
      name,
      participantId,
    });
  }

  @Get(':id/counts')
  @ApiOperation({
    summary: 'Get group with participant and person counts',
    description:
      'Retrieve details of a specific group by ID including participant and person counts',
    operationId: 'getGroupWithCountsById',
  })
  @ApiParam({
    name: 'id',
    description: 'Group ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Group details with counts',
    type: GroupWithCountsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Group not found',
  })
  async findOneWithCounts(
    @Param('id') id: string
  ): Promise<GroupWithCountsResponseDto> {
    return this.groupsService.findOneWithCounts(id);
  }

  @Get()
  @ApiOperation({
    summary: 'List all groups',
    description: 'Retrieve a list of all WhatsApp groups',
    operationId: 'getAllGroups',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of groups',
    type: PaginatedGroupsResponseDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-indexed)',
    type: Number,
  })
  @ApiQuery({
    name: 'size',
    required: false,
    description: 'Number of items per page',
    type: Number,
  })
  async findAll(
    @Query() pagination: PaginationDto
  ): Promise<PaginatedResponseDto<GroupsResponseDto>> {
    return this.groupsService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get group details',
    description: 'Retrieve details of a specific group by ID',
    operationId: 'getGroupById',
  })
  @ApiParam({
    name: 'id',
    description: 'Group ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Group details',
    type: GroupsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Group not found',
  })
  async findOne(@Param('id') id: string): Promise<GroupsResponseDto> {
    return this.groupsService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new group',
    description: 'Create a new WhatsApp group',
    operationId: 'createGroup',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Group created successfully',
    type: GroupsResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createGroupDto: GroupsCreateDto
  ): Promise<GroupsResponseDto> {
    return this.groupsService.create(createGroupDto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update group details',
    description: 'Update details of a specific group by ID',
    operationId: 'updateGroup',
  })
  @ApiParam({
    name: 'id',
    description: 'Group ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Group updated successfully',
    type: GroupsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Group not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateGroupDto: GroupsUpdateDto
  ): Promise<GroupsResponseDto> {
    return this.groupsService.update(id, updateGroupDto);
  }

  @Post(':id/activate')
  @ApiOperation({
    summary: 'Activate a group',
    description: 'Activate a specific group by ID',
    operationId: 'activateGroup',
  })
  @ApiParam({
    name: 'id',
    description: 'Group ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Group activated successfully',
    type: GroupsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Group not found',
  })
  async activate(@Param('id') id: string): Promise<GroupsResponseDto> {
    return this.groupsService.activate(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate a group',
    description: 'Deactivate a specific group by ID',
    operationId: 'deactivateGroup',
  })
  @ApiParam({
    name: 'id',
    description: 'Group ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Group deactivated successfully',
    type: GroupsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Group not found',
  })
  async deactivate(@Param('id') id: string): Promise<GroupsResponseDto> {
    return this.groupsService.deactivate(id);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a group',
    description: 'Delete a specific group by ID',
    operationId: 'deleteGroup',
  })
  @ApiParam({
    name: 'id',
    description: 'Group ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Group deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Group not found',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.groupsService.remove(id);
  }

  @Post('query')
  @ApiOperation({
    summary: 'Query groups with filters',
    description: 'Query groups with pagination and filters',
    operationId: 'queryGroups',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of groups with counts',
    type: PaginatedGroupsWithCountsResponseDto,
  })
  async queryGroups(
    @Body() queryDto: GroupsQueryDto
  ): Promise<PaginatedResponseDto<GroupWithCountsResponseDto>> {
    return this.groupsService.findAllWithCounts(
      { page: queryDto.page, size: queryDto.size },
      {
        minParticipants: queryDto.minParticipants,
        maxParticipants: queryDto.maxParticipants,
        name: queryDto.name,
        participantId: queryDto.participantId,
      }
    );
  }

  @Post('consent-message')
  @ApiOperation({
    summary: 'Update consent message ID',
    description: 'Update the consent message ID for a group',
    operationId: 'updateConsentMessageId',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Consent message ID updated successfully',
    type: GroupsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Group not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  @HttpCode(HttpStatus.OK)
  async updateConsentMessageId(
    @Body() consentMessageDto: ConsentMessageDto
  ): Promise<GroupsResponseDto> {
    return this.groupsService.updateConsentMessageId(
      consentMessageDto.whatsappGroupId,
      consentMessageDto.consentMessageId
    );
  }
}
