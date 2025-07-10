import { Injectable, BadRequestException } from '@nestjs/common';
import { Group, Prisma } from '@prisma/client';
import { GroupsResponseDto } from './dto/groups-response.dto';
import { GroupsCreateDto } from './dto/groups-create.dto';
import { GroupsUpdateDto } from './dto/groups-update.dto';
import { GroupStatus } from './dto/groups-update-status.dto';

/**
 * Mapper for Group entity and DTOs
 */
@Injectable()
export class GroupsMapper {
  /**
   * Maps a Group entity to a GroupsResponseDto
   * @param group - The Group entity to map
   * @returns The mapped GroupsResponseDto
   */
  toDto(group: Group): GroupsResponseDto {
    return {
      id: group.id,
      whatsappGroupId: group.whatsappGroupId,
      name: group.name,
      description: group.description || undefined,
      status: group.status,
      createdAt: group.createdAt,
    };
  }

  /**
   * Maps a GroupsCreateDto to a Group entity
   * @param createGroupDto - The DTO to map
   * @returns The mapped Group entity
   * @throws BadRequestException if required fields are missing or invalid
   */
  toEntityFromCreate(createGroupDto: GroupsCreateDto): Prisma.GroupCreateInput {
    if (
      !createGroupDto.whatsappGroupId ||
      !createGroupDto.whatsappGroupId.trim()
    ) {
      throw new BadRequestException('WhatsApp group ID is required');
    }

    if (!createGroupDto.name || !createGroupDto.name.trim()) {
      throw new BadRequestException('Group name is required');
    }

    return {
      whatsappGroupId: createGroupDto.whatsappGroupId.trim(),
      name: createGroupDto.name.trim(),
      description: createGroupDto.description?.trim(),
      status: GroupStatus.INACTIVE,
    };
  }

  /**
   * Maps a GroupsUpdateDto to a Group entity
   * @param updateGroupDto - The DTO to map
   * @returns The mapped Group entity
   */
  toEntityFromUpdate(updateGroupDto: GroupsUpdateDto): Prisma.GroupUpdateInput {
    const entity: Prisma.GroupUpdateInput = {};

    if (updateGroupDto.name !== undefined) {
      if (!updateGroupDto.name.trim()) {
        throw new BadRequestException('Group name cannot be empty');
      }
      entity.name = updateGroupDto.name.trim();
    }

    if (updateGroupDto.description !== undefined) {
      entity.description = updateGroupDto.description.trim();
    }

    return entity;
  }
}
