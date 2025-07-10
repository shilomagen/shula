import { Injectable } from '@nestjs/common';
import { Prisma, SystemMessage as PrismaSystemMessage } from '@prisma/client';
import { CreateSystemMessageDto } from './dto/system-messages-create.dto';
import { SystemMessageResponseDto } from './dto/system-messages-response.dto';
import { UpdateSystemMessageDto } from './dto/system-messages-update.dto';
import {
  SystemMessage,
  SystemMessageCategory,
  SystemMessageTemplateResult,
} from './system-messages.types';

@Injectable()
export class SystemMessagesMapper {
  toDto(systemMessage: PrismaSystemMessage): SystemMessageResponseDto {
    const metadata = systemMessage.metadata as
      | Record<string, unknown>
      | undefined;

    return {
      id: systemMessage.id,
      key: systemMessage.key,
      content: systemMessage.content,
      category:
        (metadata?.category as SystemMessageCategory) ||
        SystemMessageCategory.GENERAL,
      metadata,
      createdAt: systemMessage.createdAt,
      updatedAt: systemMessage.updatedAt,
    };
  }

  toEntity(dto: CreateSystemMessageDto): Prisma.SystemMessageCreateInput {
    return {
      key: dto.key,
      content: dto.content,
      metadata: dto.metadata
        ? (dto.metadata as Prisma.InputJsonValue)
        : undefined,
      status: 'active',
    };
  }

  toUpdateEntity(dto: UpdateSystemMessageDto): Prisma.SystemMessageUpdateInput {
    const updateData: Prisma.SystemMessageUpdateInput = {};

    if (dto.content !== undefined) {
      updateData.content = dto.content;
    }

    if (dto.metadata !== undefined || dto.category !== undefined) {
      updateData.metadata = {
        ...(dto.metadata || {}),
        category: dto.category,
      } as Prisma.InputJsonValue;
    }

    return updateData;
  }

  toTemplateResult(
    systemMessage: SystemMessage | PrismaSystemMessage,
    params?: Record<string, string | number | boolean>
  ): SystemMessageTemplateResult {
    let content = systemMessage.content;

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
    }

    return {
      key: systemMessage.key,
      content,
      metadata:
        'metadata' in systemMessage
          ? (systemMessage.metadata as Record<string, unknown> | undefined)
          : undefined,
    };
  }
}
