import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { validate as isUUID } from 'uuid';
import { ConversationsService } from './conversations.service';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { PaginatedConversationsResponseDto } from './dto/paginated-conversations-response.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ActionType } from './engines/graph/actions/actions';
import { ConnectPersonAction } from './engines/graph/actions/connect-person';
import { ActionRegistryService } from './engines/graph/handlers/action-registry.service';
import { ActionResult } from './engines/graph/handlers/action-handler.interface';

@ApiTags('conversations')
@Controller('v1/conversations')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly actionRegistry: ActionRegistryService
  ) {}

  @Get('participant/:participantId')
  @ApiOperation({
    summary: 'Get conversations for a participant',
    description: 'Retrieve all conversations for a specific participant',
    operationId: 'getConversationsByParticipantId',
  })
  @ApiParam({
    name: 'participantId',
    required: true,
    description: 'ID of the participant',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of conversations',
    type: [ConversationResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Participant not found',
  })
  async getConversationsByParticipantId(
    @Param('participantId') participantId: string
  ): Promise<ConversationResponseDto[]> {
    return this.conversationsService.findByParticipantId(participantId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get conversation by ID',
    description: 'Retrieve a specific conversation by its ID',
    operationId: 'getConversationById',
  })
  @ApiParam({
    name: 'id',
    description: 'Conversation ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The conversation',
    type: ConversationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  async getConversationById(
    @Param('id') id: string
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.findById(id);
  }

  @Get(':id/messages')
  @ApiOperation({
    summary: 'Get messages for a conversation',
    description: 'Retrieve all messages for a specific conversation',
    operationId: 'getConversationMessages',
  })
  @ApiParam({
    name: 'id',
    description: 'Conversation ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of messages',
    type: [MessageResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  async getConversationMessages(
    @Param('id') id: string
  ): Promise<MessageResponseDto[]> {
    return this.conversationsService.getMessages(id);
  }

  @Patch(':id/abandon')
  @ApiOperation({
    summary: 'Abandon a conversation',
    description: 'Mark a conversation as abandoned',
    operationId: 'abandonConversation',
  })
  @ApiParam({
    name: 'id',
    description: 'Conversation ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The updated conversation',
    type: ConversationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  async abandonConversation(
    @Param('id') id: string
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.abandonConversation(id);
  }

  @Post(':id/messages')
  @ApiOperation({
    summary: 'Send a message to a conversation',
    description: 'Add a new outgoing message to a conversation',
    operationId: 'sendMessage',
  })
  @ApiParam({
    name: 'id',
    description: 'Conversation ID',
  })
  @ApiBody({
    description: 'Message data',
    schema: {
      type: 'object',
      required: ['content'],
      properties: {
        content: {
          type: 'string',
          description: 'Message content',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The created message',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid message data',
  })
  async sendMessage(
    @Param('id') id: string,
    @Body() messageData: { content: string }
  ): Promise<ConversationResponseDto> {
    try {
      return await this.conversationsService.sendMessage(
        id,
        messageData.content
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  @Post('process-message')
  @ApiOperation({
    summary: 'Process an incoming message',
    description:
      'Process an incoming message and create or update a conversation',
    operationId: 'processMessage',
  })
  @ApiBody({
    description: 'Message data',
    schema: {
      type: 'object',
      required: ['participantId', 'content'],
      properties: {
        participantId: {
          type: 'string',
          format: 'uuid',
          description: 'ID of the participant sending the message',
        },
        content: {
          type: 'string',
          description: 'Message content',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The message was processed successfully',
    type: ConversationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid participant ID or message data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Participant not found',
  })
  async processMessage(
    @Body() messageData: { participantId: string; content: string }
  ): Promise<ConversationResponseDto> {
    // Validate UUID format
    if (!isUUID(messageData.participantId)) {
      throw new BadRequestException('Invalid participant ID format');
    }

    try {
      return await this.conversationsService.processIncomingMessage(
        messageData.participantId,
        messageData.content
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }

  @Post('connect-person')
  @ApiOperation({
    summary: 'Connect a person',
    description: 'Connect a person using images and assign to a group',
    operationId: 'connectPerson',
  })
  @ApiBody({
    description: 'Connect person data',
    schema: {
      type: 'object',
      required: ['participantId', 'imageIds', 'groupId', 'childName'],
      properties: {
        participantId: {
          type: 'string',
          format: 'uuid',
          description: 'ID of the participant',
        },
        imageIds: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Array of image IDs stored in S3',
        },
        groupId: {
          type: 'string',
          description: 'ID of the group to connect the person to',
        },
        childName: {
          type: 'string',
          description: 'Name of the child/person to connect',
        },
        successMessage: {
          type: 'string',
          description: 'Custom success message',
        },
        errorMessage: {
          type: 'string',
          description: 'Custom error message',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Person connected successfully',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          description: 'Whether the operation was successful',
        },
        message: {
          type: 'string',
          description: 'Success or error message',
        },
        data: {
          type: 'object',
          description: 'Additional data about the operation',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid data provided',
  })
  async connectPerson(
    @Body()
    connectPersonData: {
      participantId: string;
      imageIds: string[];
      groupId: string;
      childName: string;
      successMessage?: string;
      errorMessage?: string;
    }
  ): Promise<ActionResult> {
    // Validate UUID format
    if (!isUUID(connectPersonData.participantId)) {
      throw new BadRequestException('Invalid participant ID format');
    }

    try {
      // Create the action object
      const action: ConnectPersonAction = {
        action: ActionType.CONNECT_PERSON,
        content: {
          imageIds: connectPersonData.imageIds,
          groupId: connectPersonData.groupId,
          childName: connectPersonData.childName,
        },
        successMessage:
          connectPersonData.successMessage ||
          `Person ${connectPersonData.childName} created successfully.`,
        errorMessage:
          connectPersonData.errorMessage || 'Failed to connect person',
      };

      // Execute the action
      return await this.actionRegistry.executeAction(
        action,
        connectPersonData.participantId
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to connect person'
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Get all conversations with filtering options',
    description:
      'Retrieve a paginated list of conversations with optional filters',
    operationId: 'getAllConversations',
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
    name: 'participantName',
    required: false,
    description: 'Filter by participant name (case-insensitive, partial match)',
    type: String,
  })
  @ApiQuery({
    name: 'participantPhone',
    required: false,
    description:
      'Filter by participant phone number (case-insensitive, partial match)',
    type: String,
  })
  @ApiQuery({
    name: 'participantId',
    required: false,
    description: 'Filter by participant ID',
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated list of conversations',
    type: PaginatedConversationsResponseDto,
  })
  async getAllConversations(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('participantName') participantName?: string,
    @Query('participantPhone') participantPhone?: string,
    @Query('participantId') participantId?: string
  ): Promise<PaginatedConversationsResponseDto> {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const pageSize = size ? parseInt(size, 10) : 10;

    // Validate pagination parameters
    if (isNaN(pageNumber) || pageNumber < 1) {
      throw new BadRequestException('Page must be a positive number');
    }

    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new BadRequestException('Size must be between 1 and 100');
    }

    return this.conversationsService.findAllWithFilters(
      pageNumber,
      pageSize,
      participantName,
      participantPhone,
      participantId
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a conversation',
    description: 'Update a conversation with current node, metadata, or status',
    operationId: 'updateConversation',
  })
  @ApiParam({
    name: 'id',
    description: 'Conversation ID',
  })
  @ApiBody({
    description: 'Update conversation data',
    type: UpdateConversationDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The updated conversation',
    type: ConversationResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Conversation not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update data',
  })
  async updateConversation(
    @Param('id') id: string,
    @Body() updateData: UpdateConversationDto
  ): Promise<ConversationResponseDto> {
    try {
      return await this.conversationsService.updateConversation(id, updateData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw error;
    }
  }
}
