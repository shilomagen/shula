import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateSystemMessageDto } from './dto/system-messages-create.dto';
import { SystemMessageResponseDto } from './dto/system-messages-response.dto';
import { UpdateSystemMessageDto } from './dto/system-messages-update.dto';
import { SystemMessagesMapper } from './system-messages.mapper';
import { SystemMessageTemplateResult } from './system-messages.types';

@Injectable()
export class SystemMessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: SystemMessagesMapper
  ) {}

  async createSystemMessage(
    dto: CreateSystemMessageDto
  ): Promise<SystemMessageResponseDto> {
    const data = this.mapper.toEntity(dto);
    const prismaSystemMessage = await this.prisma.systemMessage.create({
      data,
    });
    return this.mapper.toDto(prismaSystemMessage);
  }

  async updateSystemMessage(
    id: string,
    dto: UpdateSystemMessageDto
  ): Promise<SystemMessageResponseDto> {
    await this.findSystemMessageById(id);
    const data = this.mapper.toUpdateEntity(dto);
    const prismaSystemMessage = await this.prisma.systemMessage.update({
      where: { id },
      data,
    });
    return this.mapper.toDto(prismaSystemMessage);
  }

  async findSystemMessageById(id: string): Promise<SystemMessageResponseDto> {
    const prismaSystemMessage = await this.prisma.systemMessage.findUnique({
      where: { id },
    });

    if (!prismaSystemMessage) {
      throw new NotFoundException(`System message with ID ${id} not found`);
    }

    return this.mapper.toDto(prismaSystemMessage);
  }

  async findSystemMessageByKey(key: string): Promise<SystemMessageResponseDto> {
    const prismaSystemMessage = await this.prisma.systemMessage.findUnique({
      where: { key },
    });

    if (!prismaSystemMessage) {
      throw new NotFoundException(`System message with key ${key} not found`);
    }

    return this.mapper.toDto(prismaSystemMessage);
  }

  async findAllSystemMessages(): Promise<SystemMessageResponseDto[]> {
    const prismaSystemMessages = await this.prisma.systemMessage.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    return prismaSystemMessages.map((message) => this.mapper.toDto(message));
  }

  async deleteSystemMessage(id: string): Promise<void> {
    await this.findSystemMessageById(id);
    await this.prisma.systemMessage.update({
      where: { id },
      data: { status: 'deleted' },
    });
  }

  async renderSystemMessage(
    key: string,
    params?: Record<string, string | number | boolean>
  ): Promise<SystemMessageTemplateResult> {
    const prismaSystemMessage = await this.prisma.systemMessage.findUnique({
      where: { key },
    });

    if (!prismaSystemMessage) {
      throw new NotFoundException(`System message with key ${key} not found`);
    }

    return this.mapper.toTemplateResult(prismaSystemMessage, params);
  }
}
