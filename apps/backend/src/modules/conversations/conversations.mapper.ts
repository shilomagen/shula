import { Injectable } from '@nestjs/common';
import { Conversation, Message, Prisma } from '@prisma/client';
import {
  ConversationStatus,
  ConversationType,
  MessageStatus,
  MessageType,
} from '../../common/enums/domain.enums';
import { AddMessageDto } from './dto/add-message.dto';
import { ConversationResponseDto } from './dto/conversation-response.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import {
  AgentMessage,
  ImageUploadMessage,
  MessageUnion,
  PersonConnectedMessage,
  PersonCreatedMessage,
  SystemEventMessage,
  UserMessage,
} from './types/message.types';

@Injectable()
export class ConversationsMapper {
  /**
   * Convert a conversation entity to a DTO
   */
  toConversationDto(conversation: Conversation): ConversationResponseDto {
    return {
      id: conversation.id,
      participantId: conversation.participantId,
      status: conversation.status as ConversationStatus,
      conversationType: conversation.conversationType as ConversationType,
      startedAt: conversation.startedAt,
      lastMessageAt: conversation.lastMessageAt,
      currentNode: conversation.currentNode || undefined,
      metadata: conversation.metadata as Record<string, unknown>,
    };
  }

  /**
   * Convert a message entity to a DTO
   */
  toMessageDto(message: Message): MessageResponseDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      type: message.type as unknown as MessageType,
      content: message.content || undefined,
      timestamp: message.timestamp,
      status: message.status as unknown as MessageStatus,
      photoId: message.photoId || undefined,
      metadata: message.metadata as Record<string, unknown>,
    };
  }

  /**
   * Convert a conversation DTO to an entity
   */
  toConversationEntity(
    dto: CreateConversationDto
  ): Prisma.ConversationCreateInput {
    return {
      participant: {
        connect: {
          id: dto.participantId,
        },
      },
      conversationType: dto.conversationType,
      status: ConversationStatus.ACTIVE,
      currentNode: dto.currentNode,
      metadata: dto.metadata as Prisma.InputJsonValue,
    };
  }

  /**
   * Convert a message DTO to an entity
   */
  toMessageEntity(dto: AddMessageDto): Prisma.MessageCreateInput {
    const { conversationId, photoId, ...rest } = dto;

    return {
      conversation: {
        connect: {
          id: conversationId,
        },
      },
      ...rest,
      metadata: rest.metadata as Prisma.InputJsonValue,
      photoId: photoId || undefined,
    };
  }

  /**
   * Convert a message entity to a union type based on message type
   */
  toMessageUnion(dbMessage: Message): MessageUnion {
    // Convert Prisma enum to domain enum by matching the string values
    const messageType = dbMessage.type;

    switch (messageType) {
      case MessageType.USER_MESSAGE:
        return this.toUserMessage(dbMessage);
      case MessageType.AGENT_MESSAGE:
        return this.toAgentMessage(dbMessage);
      case MessageType.IMAGE_UPLOAD:
        return this.toImageUploadMessage(dbMessage);
      case MessageType.PERSON_CREATED:
        return this.toPersonCreatedMessage(dbMessage);
      case MessageType.PERSON_CONNECTED:
        return this.toPersonConnectedMessage(dbMessage);
      case MessageType.SYSTEM_EVENT:
        return this.toSystemEventMessage(dbMessage);
      default:
        throw new Error(`Unsupported message type: ${dbMessage.type}`);
    }
  }

  private toUserMessage(dbMessage: Message): UserMessage {
    if (!dbMessage.content) {
      throw new Error('User message must have content');
    }

    return {
      id: dbMessage.id,
      conversationId: dbMessage.conversationId,
      type: MessageType.USER_MESSAGE,
      content: dbMessage.content,
      timestamp: dbMessage.timestamp,
      status: dbMessage.status,
    };
  }

  private toAgentMessage(dbMessage: Message): AgentMessage {
    if (!dbMessage.content) {
      throw new Error('Agent message must have content');
    }

    return {
      id: dbMessage.id,
      conversationId: dbMessage.conversationId,
      type: MessageType.AGENT_MESSAGE,
      content: dbMessage.content,
      timestamp: dbMessage.timestamp,
      status: dbMessage.status as unknown as MessageStatus,
    };
  }

  private toImageUploadMessage(dbMessage: Message): ImageUploadMessage {
    if (!dbMessage.photoId) {
      throw new Error('Image upload message must have photo ID');
    }

    return {
      id: dbMessage.id,
      conversationId: dbMessage.conversationId,
      type: MessageType.IMAGE_UPLOAD,
      photoId: dbMessage.photoId,
      content: dbMessage.content ?? undefined,
      timestamp: dbMessage.timestamp,
      status: dbMessage.status as unknown as MessageStatus,
    };
  }

  private toPersonCreatedMessage(dbMessage: Message): PersonCreatedMessage {
    if (!dbMessage.metadata) {
      throw new Error('Person created message must have metadata');
    }

    const metadata = dbMessage.metadata as {
      personId: string;
      personName: string;
    };
    if (!metadata.personName || !metadata.personId) {
      throw new Error(
        'Person created message metadata must have personName and personId'
      );
    }

    return {
      id: dbMessage.id,
      conversationId: dbMessage.conversationId,
      type: MessageType.PERSON_CREATED,
      personId: metadata.personId,
      content: dbMessage.content ?? undefined,
      metadata: { personName: metadata.personName },
      timestamp: dbMessage.timestamp,
      status: dbMessage.status as unknown as MessageStatus,
    };
  }

  private toPersonConnectedMessage(dbMessage: Message): PersonConnectedMessage {
    if (!dbMessage.metadata) {
      throw new Error('Person connected message must have metadata');
    }

    const metadata = dbMessage.metadata as {
      personId: string;
      personName: string;
      relationship?: string;
    };

    if (!metadata.personName || !metadata.personId) {
      throw new Error(
        'Person connected message metadata must have personName and personId'
      );
    }

    return {
      id: dbMessage.id,
      conversationId: dbMessage.conversationId,
      type: MessageType.PERSON_CONNECTED,
      personId: metadata.personId,
      content: dbMessage.content ?? undefined,
      metadata: {
        personName: metadata.personName,
        relationship: metadata.relationship,
      },
      timestamp: dbMessage.timestamp,
      status: dbMessage.status as unknown as MessageStatus,
    };
  }

  private toSystemEventMessage(dbMessage: Message): SystemEventMessage {
    if (!dbMessage.content) {
      throw new Error('System event message must have content');
    }

    return {
      id: dbMessage.id,
      conversationId: dbMessage.conversationId,
      type: MessageType.SYSTEM_EVENT,
      content: dbMessage.content,
      metadata: dbMessage.metadata as Record<string, unknown>,
      timestamp: dbMessage.timestamp,
      status: dbMessage.status as unknown as MessageStatus,
    };
  }

  // Helper method to map an array of messages
  toMessageUnionArray(messages: Message[]): MessageUnion[] {
    return messages.map((message) => this.toMessageUnion(message));
  }
}
