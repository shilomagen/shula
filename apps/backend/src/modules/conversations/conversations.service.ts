import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ContextLogger } from 'nestjs-context-logger';
import {
  ConversationStatus,
  ConversationType,
  MessageType,
} from '../../common/enums/domain.enums';
import { PrismaService } from '../../database/prisma.service';
import { OutboundMessageService } from '../outbound-messages/services/outbound-message.service';
import { ParticipantsResponseDto } from '../participants/dto/participants-response.dto';
import { ParticipantsService } from '../participants/participants.service';
import { ParticipantContext } from '../participants/participants.types';
import { ConversationsMapper } from './conversations.mapper';
import { AddMessageDto } from './dto/add-message.dto';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { PaginatedConversationsResponseDto } from './dto/paginated-conversations-response.dto';
import {
  ConversationEngineResponse,
  ConversationEngineService,
} from './engines/conversation-engine.service';
import { PromptName } from './engines/graph/models';

/**
 * Interface for conversation metadata
 * Note: currentNode is now a dedicated field in the Conversation model
 */
export interface ConversationMetadata {
  [key: string]: any;
}

@Injectable()
export class ConversationsService {
  private readonly logger = new ContextLogger(ConversationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationsMapper: ConversationsMapper,
    private readonly conversationEngine: ConversationEngineService,
    private readonly participantsService: ParticipantsService,
    private readonly outboundMessageService: OutboundMessageService
  ) {}

  /**
   * Find all conversations for a participant
   * @param participantId - The participant ID
   * @returns Array of conversations
   */
  async findByParticipantId(
    participantId: string
  ): Promise<ConversationResponseDto[]> {
    const conversations = await this.prisma.conversation.findMany({
      where: { participantId },
      orderBy: { lastMessageAt: 'desc' },
    });

    return conversations.map((conversation) =>
      this.conversationsMapper.toConversationDto(conversation)
    );
  }

  /**
   * Find a conversation by ID
   * @param id - Conversation ID
   * @returns The found conversation
   * @throws NotFoundException if conversation not found
   */
  async findById(id: string): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    return this.conversationsMapper.toConversationDto(conversation);
  }

  /**
   * Find the active conversation of a specific type for a participant
   * @param participantId - The participant ID
   * @param conversationType - The type of conversation
   * @returns The active conversation or null if none exists
   */
  async findActiveByType(
    participantId: string,
    conversationType: ConversationType
  ): Promise<ConversationResponseDto | null> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        participantId,
        conversationType,
        status: 'active',
      },
    });

    if (!conversation) {
      return null;
    }

    return this.conversationsMapper.toConversationDto(conversation);
  }

  /**
   * Get messages for a conversation
   * @param conversationId - The conversation ID
   * @returns Array of messages
   * @throws NotFoundException if conversation not found
   */
  async getMessages(conversationId: string): Promise<MessageResponseDto[]> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' },
    });

    return messages.map((message) =>
      this.conversationsMapper.toMessageDto(message)
    );
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    dto: CreateConversationDto
  ): Promise<ConversationResponseDto> {
    // Check if there's already an active conversation of this type
    const existingConversation = await this.findActiveByType(
      dto.participantId,
      dto.conversationType
    );

    // If there is, return it instead of creating a new one
    if (existingConversation) {
      return existingConversation;
    }

    // Create the conversation with properly typed data
    const conversation = await this.prisma.conversation.create({
      data: {
        participant: {
          connect: {
            id: dto.participantId,
          },
        },
        status: ConversationStatus.ACTIVE,
        conversationType: dto.conversationType,
        currentNode: dto.currentNode,
        metadata: dto.metadata
          ? (dto.metadata as Prisma.InputJsonValue)
          : undefined,
      },
    });

    return this.conversationsMapper.toConversationDto(conversation);
  }

  /**
   * Add a message to a conversation
   * @param dto - Message data
   * @returns The created message
   * @throws NotFoundException if conversation not found
   */
  async addMessage(dto: AddMessageDto): Promise<MessageResponseDto> {
    const entityData = this.conversationsMapper.toMessageEntity(dto);

    const message = await this.prisma.message.create({
      data: entityData,
    });

    // Update the conversation's lastMessageAt timestamp
    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { lastMessageAt: message.timestamp },
    });

    return this.conversationsMapper.toMessageDto(message);
  }

  /**
   * Complete a conversation
   * @param id - Conversation ID
   * @returns The updated conversation
   * @throws NotFoundException if conversation not found
   */
  async completeConversation(id: string): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    const updatedConversation = await this.prisma.conversation.update({
      where: { id },
      data: { status: ConversationStatus.COMPLETED },
    });

    return this.conversationsMapper.toConversationDto(updatedConversation);
  }

  /**
   * Abandon a conversation
   * @param id - Conversation ID
   * @returns The updated conversation
   * @throws NotFoundException if conversation not found
   */
  async abandonConversation(id: string): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    const updatedConversation = await this.prisma.conversation.update({
      where: { id },
      data: { status: ConversationStatus.ABANDONED },
    });

    return this.conversationsMapper.toConversationDto(updatedConversation);
  }

  /**
   * Process an incoming message from a participant
   * @param participantId - The participant ID
   * @param message - The message content
   * @param mediaInfo - Optional media information
   */
  async processIncomingMessage(
    participantId: string,
    message: string,
    mediaInfo?: {
      photoId: string;
      mimeType: string;
      s3Url: string;
      size: number;
      expiresAt: string;
    }
  ): Promise<ConversationResponseDto> {
    // Get the participant
    const participant = await this.participantsService.findById(participantId);
    if (!participant) {
      throw new NotFoundException(
        `Participant with ID ${participantId} not found`
      );
    }

    const conversation = await this.getOrCreateGeneralConversation(
      participantId
    );

    // If we have media info, add an IMAGE_UPLOAD message first
    if (mediaInfo) {
      await this.addMessage({
        conversationId: conversation.id,
        type: MessageType.IMAGE_UPLOAD,
        photoId: mediaInfo.photoId,
        metadata: {
          mimeType: mediaInfo.mimeType,
          s3Url: mediaInfo.s3Url,
          size: mediaInfo.size,
          expiresAt: mediaInfo.expiresAt,
        },
      });
    }

    // Only add text message and generate response if there's actual content
    if (message.trim()) {
      const messageDto: AddMessageDto = {
        conversationId: conversation.id,
        type: MessageType.USER_MESSAGE,
        content: message,
      };
      await this.addMessage(messageDto);
    }

    await this.generateResponse(participant, message, conversation.id);

    // Return the updated conversation
    return this.findById(conversation.id);
  }

  /**
   * Generate a response to a user message
   */
  private async generateResponse(
    participant: ParticipantsResponseDto,
    message: string,
    conversationId: string
  ): Promise<MessageResponseDto> {
    try {
      // Get the conversation with its messages
      const conversationWithMessages =
        await this.prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            messages: {
              orderBy: { timestamp: 'asc' },
            },
          },
        });

      if (!conversationWithMessages) {
        throw new NotFoundException(
          `Conversation with ID ${conversationId} not found`
        );
      }

      // Get participant context (groups and persons)
      const participantContext = await this.getParticipantContext(
        participant.id,
        participant.name
      );

      this.logger.info('Participant context', {
        participantContext,
      });

      // Convert messages to message unions
      this.logger.info('Converting messages to message unions', {
        messages: conversationWithMessages.messages,
      });
      const messageUnions = this.conversationsMapper.toMessageUnionArray(
        conversationWithMessages.messages
      );

      this.logger.info('Calling conversation engine', {
        historyLength: messageUnions.length,
        groupsCount: participantContext.groups.length,
        currentNode: (conversationWithMessages.metadata as ConversationMetadata)
          ?.currentNode,
      });

      // Generate response using the conversation engine
      const engineResponse: ConversationEngineResponse =
        await this.conversationEngine.generateResponse({
          participantId: participant.id,
          participantName: participant.name,
          conversationId,
          message,
          conversationHistory: messageUnions,
          participantContext,
          metadata: {
            currentNode: (
              conversationWithMessages.metadata as ConversationMetadata
            )?.currentNode,
          },
          currentNode: conversationWithMessages.currentNode || undefined,
          onConversationUpdate: async (payload) => {
            // Update conversation with payload (can include metadata and/or currentNode)
            await this.updateConversation(conversationId, payload);
          },
        });

      this.logger.info('Engine response', {
        content: engineResponse.content,
        metadata: engineResponse.metadata,
      });
      // Add the agent's response as a message
      const responseMessageDto: AddMessageDto = {
        conversationId,
        type: MessageType.AGENT_MESSAGE,
        content: engineResponse.content,
        metadata: engineResponse.metadata,
      };

      this.logger.info('Adding response message', {
        responseMessageDto,
      });
      const responseMessage = await this.addMessage(responseMessageDto);

      // Send the message to the participant via WhatsApp
      await this.outboundMessageService.sendMessage(
        participant.phoneNumber,
        engineResponse.content,
        undefined,
        {
          type: 'CONVERSATION_RESPONSE',
          conversationId,
          participantId: participant.id,
        }
      );

      return responseMessage;
    } catch (error: unknown) {
      this.logger.error('Error generating response', { error });
      throw error;
    }
  }

  /**
   * Get participant context including groups and persons
   * @param participantId - The ID of the participant
   * @param participantName - The name of the participant
   * @returns The participant context
   */
  private async getParticipantContext(
    participantId: string,
    participantName: string
  ): Promise<ParticipantContext> {
    try {
      return this.participantsService.buildParticipantContext(
        participantId,
        participantName
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Error getting participant context: ${errorMessage}`, {
        error,
      });
      return {
        name: participantName,
        groups: [],
      };
    }
  }

  /**
   * Send a message to a participant
   */
  async sendMessage(
    conversationId: string,
    content: string
  ): Promise<ConversationResponseDto> {
    const messageDto: AddMessageDto = {
      conversationId,
      content,
      type: MessageType.AGENT_MESSAGE,
    };
    await this.addMessage(messageDto);

    // Get the conversation with participant info
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participant: true },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation with ID ${conversationId} not found`
      );
    }

    // Send the message to the participant via WhatsApp
    await this.outboundMessageService.sendMessage(
      conversation.participant.phoneNumber,
      content,
      undefined,
      {
        type: 'CONVERSATION_RESPONSE',
        conversationId,
        participantId: conversation.participant.id,
      }
    );

    return this.findById(conversationId);
  }

  /**
   * Update conversation fields
   * @param id - Conversation ID
   * @param payload - Fields to update (can include metadata and/or currentNode)
   * @returns The updated conversation
   * @throws NotFoundException if conversation not found
   */
  async updateConversation(
    id: string,
    payload: {
      metadata?: ConversationMetadata;
      currentNode?: string;
      status?: ConversationStatus;
    }
  ): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // Create update data with only defined fields from payload
    const updateData: Prisma.ConversationUpdateInput = {};

    if (payload.metadata) {
      updateData.metadata = payload.metadata as Prisma.InputJsonValue;

      // If currentNode is in metadata and not explicitly defined in payload
      // also update the dedicated currentNode field
      if ('currentNode' in payload.metadata && !payload.currentNode) {
        updateData.currentNode = payload.metadata.currentNode as string;
      }
    }

    if (payload.currentNode) {
      updateData.currentNode = payload.currentNode;
    }

    if (payload.status) {
      updateData.status = payload.status;
    }

    const updatedConversation = await this.prisma.conversation.update({
      where: { id },
      data: updateData,
    });

    return this.conversationsMapper.toConversationDto(updatedConversation);
  }

  /**
   * Get or create a general conversation for a participant
   * @param participantId - The participant ID
   * @returns The active general conversation
   */
  async getOrCreateGeneralConversation(
    participantId: string
  ): Promise<ConversationResponseDto> {
    const activeConversation = await this.findActiveByType(
      participantId,
      ConversationType.GENERAL
    );

    if (activeConversation) {
      return activeConversation;
    }

    return this.createConversation({
      participantId,
      conversationType: ConversationType.GENERAL,
      currentNode: PromptName.START_NODE,
      metadata: {
        currentNode: PromptName.START_NODE,
      } as ConversationMetadata,
    });
  }

  /**
   * Find all conversations with filtering options
   * @param page - Page number (1-based index)
   * @param size - Number of items per page
   * @param participantName - Optional filter by participant name
   * @param participantPhone - Optional filter by participant phone number
   * @param participantId - Optional filter by participant ID
   * @returns Paginated conversations
   */
  async findAllWithFilters(
    page = 1,
    size = 10,
    participantName?: string,
    participantPhone?: string,
    participantId?: string
  ): Promise<PaginatedConversationsResponseDto> {
    // Convert page to 0-based index for database
    const skip = (page - 1) * size;

    // Build the where conditions
    const where: Prisma.ConversationWhereInput = {};

    // Add participant filters if provided
    if (participantName || participantPhone || participantId) {
      where.participant = {};

      if (participantName) {
        where.participant.name = {
          contains: participantName,
          mode: 'insensitive',
        };
      }

      if (participantPhone) {
        where.participant.phoneNumber = {
          contains: participantPhone,
          mode: 'insensitive',
        };
      }

      if (participantId) {
        where.participantId = participantId;
      }
    }

    // Get the total count
    const total = await this.prisma.conversation.count({ where });

    // Calculate total pages
    const pages = Math.ceil(total / size);

    // Execute the query with pagination
    const conversations = await this.prisma.conversation.findMany({
      where,
      include: {
        participant: true,
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      skip,
      take: size,
    });

    // Map to DTOs
    const items = conversations.map((conversation) =>
      this.conversationsMapper.toConversationDto(conversation)
    );

    // Create and return the paginated response
    const paginatedResponse = new PaginatedConversationsResponseDto();
    paginatedResponse.items = items;
    paginatedResponse.page = page;
    paginatedResponse.size = size;
    paginatedResponse.total = total;
    paginatedResponse.pages = pages;

    return paginatedResponse;
  }
}
