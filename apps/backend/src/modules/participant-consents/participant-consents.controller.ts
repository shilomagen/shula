import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateParticipantConsentDto } from './dto/create-participant-consent.dto';
import { GroupConsentStatusResponseDto } from './dto/group-consent-status-response.dto';
import { ParticipantConsentResponseDto } from './dto/participant-consent-response.dto';
import { ParticipantsConsentStatusResponseDto } from './dto/participants-consent-status-response.dto';
import { UpdateParticipantConsentDto } from './dto/update-participant-consent.dto';
import { ParticipantConsentsService } from './participant-consents.service';

@ApiTags('participant-consents')
@Controller('v1/participant-consents')
export class ParticipantConsentsController {
  constructor(
    private readonly participantConsentsService: ParticipantConsentsService
  ) {}

  @Get('group/:groupId')
  @ApiOperation({
    summary: 'Get all consents for a group',
    description: 'Retrieve all consent records for a specific group',
    operationId: 'getConsentsByGroupId',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of consent records for the group',
    type: [ParticipantConsentResponseDto],
  })
  async getByGroupId(
    @Param('groupId') groupId: string
  ): Promise<ParticipantConsentResponseDto[]> {
    return this.participantConsentsService.findByGroupId(groupId);
  }

  @Get('participant/:participantId')
  @ApiOperation({
    summary: 'Get all consents for a participant',
    description: 'Retrieve all consent records for a specific participant',
    operationId: 'getConsentsByParticipantId',
  })
  @ApiParam({
    name: 'participantId',
    description: 'Participant ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of consent records for the participant',
    type: [ParticipantConsentResponseDto],
  })
  async getByParticipantId(
    @Param('participantId') participantId: string
  ): Promise<ParticipantConsentResponseDto[]> {
    return this.participantConsentsService.findByParticipantId(participantId);
  }

  @Get('group/:groupId/status')
  @ApiOperation({
    summary: 'Get consent status for a group',
    description: 'Retrieve the overall consent status for a specific group',
    operationId: 'getGroupConsentStatus',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Group consent status',
    type: GroupConsentStatusResponseDto,
  })
  async getGroupConsentStatus(
    @Param('groupId') groupId: string
  ): Promise<GroupConsentStatusResponseDto> {
    const isApproved =
      await this.participantConsentsService.calculateGroupConsentStatus(
        groupId
      );

    return {
      groupId,
      isApproved,
      status:
        isApproved === true
          ? 'approved'
          : isApproved === false
          ? 'rejected'
          : 'pending',
    };
  }

  @Get(':groupId/:participantId')
  @ApiOperation({
    summary: 'Get consent record',
    description:
      'Retrieve a specific consent record by group and participant IDs',
    operationId: 'getConsentRecord',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    type: String,
    format: 'uuid',
  })
  @ApiParam({
    name: 'participantId',
    description: 'Participant ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Consent record',
    type: ParticipantConsentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Consent record not found',
  })
  async getConsentRecord(
    @Param('groupId') groupId: string,
    @Param('participantId') participantId: string
  ): Promise<ParticipantConsentResponseDto> {
    return this.participantConsentsService.findOne(groupId, participantId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create consent record',
    description: 'Create a new consent record for a participant in a group',
    operationId: 'createConsentRecord',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Consent record created successfully',
    type: ParticipantConsentResponseDto,
  })
  async create(
    @Body() createDto: CreateParticipantConsentDto
  ): Promise<ParticipantConsentResponseDto> {
    return this.participantConsentsService.create(createDto);
  }

  @Post('batch')
  @ApiOperation({
    summary: 'Create multiple consent records',
    description: 'Create multiple consent records for participants in a group',
    operationId: 'createManyConsentRecords',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Consent records created successfully',
    schema: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Number of records created',
        },
      },
    },
  })
  async createMany(
    @Body() createDto: CreateParticipantConsentDto[]
  ): Promise<{ count: number }> {
    return this.participantConsentsService.createMany(createDto);
  }

  @Patch(':groupId/:participantId')
  @ApiOperation({
    summary: 'Update consent record',
    description: 'Update a consent record for a participant in a group',
    operationId: 'updateConsentRecord',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    type: String,
    format: 'uuid',
  })
  @ApiParam({
    name: 'participantId',
    description: 'Participant ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Consent record updated successfully',
    type: ParticipantConsentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Consent record not found',
  })
  async update(
    @Param('groupId') groupId: string,
    @Param('participantId') participantId: string,
    @Body() updateDto: UpdateParticipantConsentDto
  ): Promise<ParticipantConsentResponseDto> {
    return this.participantConsentsService.update(
      groupId,
      participantId,
      updateDto
    );
  }

  @Get('group/:groupId/participants')
  @ApiOperation({
    summary: 'Get participants consent status for a group',
    description:
      'Retrieve consent status for all participants in a specific group',
    operationId: 'getParticipantsConsentStatus',
  })
  @ApiParam({
    name: 'groupId',
    description: 'Group ID',
    type: String,
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of participants with their consent status',
    type: ParticipantsConsentStatusResponseDto,
  })
  async getParticipantsConsentStatus(
    @Param('groupId') groupId: string
  ): Promise<ParticipantsConsentStatusResponseDto> {
    const participants =
      await this.participantConsentsService.getParticipantsConsentStatus(
        groupId
      );

    return { items: participants };
  }
}
