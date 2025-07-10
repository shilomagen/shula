import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EntityStatus } from '@prisma/client';
import { ContextLogger } from 'nestjs-context-logger';
import { PaginatedParticipantsWithCountsResponseDto } from './dto/paginated-participants-with-counts-response.dto';
import { ParticipantContextResponseDto } from './dto/participant-context-response.dto';
import { ParticipantsCreateDto } from './dto/participants-create.dto';
import { ParticipantsQueryDto } from './dto/participants-query.dto';
import { ParticipantsResponseDto } from './dto/participants-response.dto';
import { ParticipantsUpdateStatusDto } from './dto/participants-update-status.dto';
import { ParticipantsUpdateDto } from './dto/participants-update.dto';
import { ParticipantsService } from './participants.service';

@ApiTags('participants')
@Controller('v1/participants')
export class ParticipantsController {
  private readonly logger = new ContextLogger(ParticipantsController.name);

  constructor(private readonly participantsService: ParticipantsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all participants',
    operationId: 'getAllParticipants',
  })
  @ApiResponse({
    status: 200,
    description: 'List of participants',
    type: [ParticipantsResponseDto],
  })
  @ApiQuery({
    name: 'groupId',
    required: false,
    description: 'Filter participants by group ID',
  })
  async findAll(
    @Query('groupId') groupId?: string
  ): Promise<ParticipantsResponseDto[]> {
    if (groupId) {
      return this.participantsService.findByGroupId(groupId);
    }
    return this.participantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get participant by ID',
    operationId: 'getParticipantById',
  })
  @ApiResponse({
    status: 200,
    description: 'The participant',
    type: ParticipantsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Participant not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Participant ID',
  })
  async findById(@Param('id') id: string): Promise<ParticipantsResponseDto> {
    return this.participantsService.findById(id);
  }

  @Get('phone/:phoneNumber')
  @ApiOperation({
    summary: 'Get participant by phone number',
    operationId: 'getParticipantByPhoneNumber',
  })
  @ApiResponse({
    status: 200,
    description: 'The participant',
    type: ParticipantsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Participant not found',
  })
  @ApiParam({
    name: 'phoneNumber',
    description: 'Participant phone number',
  })
  async findByPhoneNumber(
    @Param('phoneNumber') phoneNumber: string
  ): Promise<ParticipantsResponseDto> {
    const participant = await this.participantsService.findByPhoneNumber(
      phoneNumber
    );
    if (!participant) {
      throw new NotFoundException(
        `Participant with phone number ${phoneNumber} not found`
      );
    }
    return participant;
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new participant',
    operationId: 'createParticipant',
  })
  @ApiResponse({
    status: 201,
    description: 'The participant has been created',
    type: ParticipantsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid participant data',
  })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createParticipantDto: ParticipantsCreateDto
  ): Promise<ParticipantsResponseDto> {
    return this.participantsService.create(createParticipantDto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a participant',
    operationId: 'updateParticipant',
  })
  @ApiResponse({
    status: 200,
    description: 'The participant has been updated',
    type: ParticipantsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Participant not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid participant data',
  })
  @ApiParam({
    name: 'id',
    description: 'Participant ID',
  })
  async update(
    @Param('id') id: string,
    @Body() updateParticipantDto: ParticipantsUpdateDto
  ): Promise<ParticipantsResponseDto> {
    return this.participantsService.update(id, updateParticipantDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update participant status',
    operationId: 'updateParticipantStatus',
  })
  @ApiResponse({
    status: 200,
    description: 'The participant status has been updated',
    type: ParticipantsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Participant not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status data',
  })
  @ApiParam({
    name: 'id',
    description: 'Participant ID',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: ParticipantsUpdateStatusDto
  ): Promise<ParticipantsResponseDto> {
    return this.participantsService.updateStatus(id, updateStatusDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a participant',
    operationId: 'deleteParticipant',
  })
  @ApiResponse({
    status: 200,
    description: 'The participant has been deleted',
    type: ParticipantsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Participant not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Participant ID',
  })
  async delete(@Param('id') id: string): Promise<ParticipantsResponseDto> {
    return this.participantsService.delete(id);
  }

  @Post(':id/groups/:groupId')
  @ApiOperation({
    summary: 'Add participant to a group',
    operationId: 'addParticipantToGroup',
  })
  @ApiResponse({
    status: 200,
    description: 'The participant has been added to the group',
    type: ParticipantsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Participant or group not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Participant ID',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
  })
  async addToGroup(
    @Param('id') id: string,
    @Param('groupId') groupId: string
  ): Promise<ParticipantsResponseDto> {
    return this.participantsService.addToGroup(id, groupId);
  }

  @Delete(':id/groups/:groupId')
  @ApiOperation({
    summary: 'Remove participant from a group',
    operationId: 'removeParticipantFromGroup',
  })
  @ApiResponse({
    status: 200,
    description: 'The participant has been removed from the group',
    type: ParticipantsResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Participant or group not found',
  })
  @ApiParam({
    name: 'id',
    description: 'Participant ID',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
  })
  async removeFromGroup(
    @Param('id') id: string,
    @Param('groupId') groupId: string
  ): Promise<ParticipantsResponseDto> {
    return this.participantsService.removeFromGroup(id, groupId);
  }

  @Get(':id/context')
  @ApiOperation({
    summary: 'Get participant context',
    description:
      'Get the context for a participant including groups and related persons',
    operationId: 'getParticipantContext',
  })
  @ApiResponse({
    status: 200,
    description: 'The participant context',
    type: ParticipantContextResponseDto,
  })
  @ApiParam({
    name: 'id',
    description: 'Participant ID',
    required: true,
  })
  async getParticipantContext(
    @Param('id') participantId: string
  ): Promise<ParticipantContextResponseDto> {
    this.logger.debug(`Getting context for participant: ${participantId}`);

    // Get the participant to get the name
    const participant = await this.participantsService.findById(participantId);
    if (!participant) {
      throw new NotFoundException(
        `Participant with ID ${participantId} not found`
      );
    }

    const context = await this.participantsService.buildParticipantContext(
      participantId,
      participant.name
    );

    return this.participantsService.participantsMapper.toContextResponseDto(
      context
    );
  }

  @Get('query/with-counts')
  @ApiOperation({
    summary:
      'Query participants with pagination and filtering, including counts',
    description:
      'Get a paginated list of participants with group and person counts',
    operationId: 'queryParticipantsWithCounts',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of participants with counts',
    type: PaginatedParticipantsWithCountsResponseDto,
  })
  async queryParticipantsWithCounts(
    @Query() query: ParticipantsQueryDto
  ): Promise<PaginatedParticipantsWithCountsResponseDto> {
    const { page, size, name, phoneNumber, status } = query;

    // Convert status string to EntityStatus enum if provided
    let statusFilter: EntityStatus | undefined;
    if (status) {
      statusFilter = status as EntityStatus;
    }

    return this.participantsService.queryParticipantsWithCounts(
      { page, size },
      { name, phoneNumber, status: statusFilter }
    );
  }
}
