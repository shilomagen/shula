import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ContextLogger } from 'nestjs-context-logger';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { PrismaService } from '../../database/prisma.service';
import { GroupMessagesService } from '../group-messages/group-messages.service';
import { GroupStatsResponseDto } from './dto/group-stats-response.dto';
import { GroupWithCountsResponseDto } from './dto/group-with-counts-response.dto';
import { GroupsCreateDto } from './dto/groups-create.dto';
import { GroupsResponseDto } from './dto/groups-response.dto';
import { GroupStatus } from './dto/groups-update-status.dto';
import { GroupsUpdateDto } from './dto/groups-update.dto';
import { GroupsMapper } from './groups.mapper';

// Define the filter parameters interface
interface GroupFilterParams {
  minParticipants?: number;
  maxParticipants?: number;
  name?: string;
  participantId?: string;
}

/**
 * Service for managing WhatsApp groups
 */
@Injectable()
export class GroupsService {
  private readonly logger = new ContextLogger(GroupsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly groupsMapper: GroupsMapper,
    private readonly groupMessagesService: GroupMessagesService
  ) {}

  /**
   * Get group statistics
   * @returns Statistics about groups
   */
  async getStats(): Promise<GroupStatsResponseDto> {
    const [activeCount, inactiveCount, total] = await Promise.all([
      this.prisma.group.count({
        where: { status: GroupStatus.ACTIVE },
      }),
      this.prisma.group.count({
        where: { status: GroupStatus.INACTIVE },
      }),
      this.prisma.group.count(),
    ]);

    return {
      totalActive: activeCount,
      totalInactive: inactiveCount,
      total,
    };
  }

  /**
   * Get participant count for a group
   * @param groupId - Group ID
   * @returns Number of participants
   */
  private async getParticipantCount(groupId: string): Promise<number> {
    return this.prisma.groupParticipant.count({
      where: { groupId },
    });
  }

  /**
   * Get person count for a group
   * @param groupId - Group ID
   * @returns Number of persons
   */
  private async getPersonCount(groupId: string): Promise<number> {
    return this.prisma.person.count({
      where: { groupId },
    });
  }

  /**
   * Find one group with counts
   * @param id - Group ID
   * @returns Group with counts
   */
  async findOneWithCounts(id: string): Promise<GroupWithCountsResponseDto> {
    const group = await this.findOne(id);

    const [participantsCount, personsCount] = await Promise.all([
      this.getParticipantCount(id),
      this.getPersonCount(id),
    ]);

    return {
      ...group,
      participantsCount,
      personsCount,
    };
  }

  /**
   * Find all groups with counts and filtering
   * @param pagination - Pagination parameters
   * @param filterParams - Filter parameters
   * @returns Paginated list of groups with counts
   */
  async findAllWithCounts(
    pagination: PaginationDto,
    filterParams?: GroupFilterParams
  ): Promise<PaginatedResponseDto<GroupWithCountsResponseDto>> {
    const page = pagination.page ?? 1;
    const size = pagination.size ?? 10;
    const skip = (page - 1) * size;

    // Build where clause for filtering
    const where: Prisma.GroupWhereInput = {};

    // Add name filter if provided
    if (filterParams?.name) {
      where.name = {
        contains: filterParams.name,
        mode: 'insensitive', // Case-insensitive search
      };
    }

    // Add participant filter if provided
    if (filterParams?.participantId) {
      where.participants = {
        some: {
          participantId: filterParams.participantId,
        },
      };
    }

    // Get all groups first
    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        skip,
        take: Number(size),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.group.count({ where }),
    ]);

    // Get counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const [participantsCount, personsCount] = await Promise.all([
          this.getParticipantCount(group.id),
          this.getPersonCount(group.id),
        ]);

        const groupDto = this.groupsMapper.toDto(group);
        return {
          ...groupDto,
          participantsCount,
          personsCount,
        };
      })
    );

    // Filter based on participant count if specified
    let filteredGroups = groupsWithCounts;
    if (
      filterParams?.minParticipants !== undefined ||
      filterParams?.maxParticipants !== undefined
    ) {
      filteredGroups = groupsWithCounts.filter((group) => {
        let passesFilter = true;

        if (filterParams.minParticipants !== undefined) {
          passesFilter =
            passesFilter &&
            group.participantsCount >= filterParams.minParticipants;
        }

        if (filterParams.maxParticipants !== undefined) {
          passesFilter =
            passesFilter &&
            group.participantsCount <= filterParams.maxParticipants;
        }

        return passesFilter;
      });
    }

    const pages = Math.ceil(total / size);

    return {
      items: filteredGroups,
      total: filteredGroups.length,
      page,
      size,
      pages,
    };
  }

  /**
   * Find all groups with pagination
   * @param pagination - Pagination parameters
   * @returns Paginated list of groups
   */
  async findAll(
    pagination: PaginationDto
  ): Promise<PaginatedResponseDto<GroupsResponseDto>> {
    const page = pagination.page ?? 1;
    const size = pagination.size ?? 10;
    const skip = (page - 1) * size;

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        skip,
        take: Number(size),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.group.count(),
    ]);

    const pages = Math.ceil(total / size);

    return {
      items: groups.map((group) => this.groupsMapper.toDto(group)),
      total,
      page,
      size,
      pages,
    };
  }

  /**
   * Find a group by ID
   * @param id - Group ID
   * @returns Group details
   * @throws NotFoundException if group not found
   */
  async findOne(id: string): Promise<GroupsResponseDto> {
    try {
      const group = await this.prisma.group.findUnique({
        where: { id },
      });

      if (!group) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }

      return this.groupsMapper.toDto(group);
    } catch (error: unknown) {
      // If the error is related to invalid UUID format
      if (error instanceof Error && error.message.includes('UUID')) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Create a new group
   * @param createGroupDto - Group creation data
   * @returns Created group
   * @throws BadRequestException if validation fails
   */
  async create(createGroupDto: GroupsCreateDto): Promise<GroupsResponseDto> {
    try {
      const data = this.groupsMapper.toEntityFromCreate(createGroupDto);
      const group = await this.prisma.group.create({ data });
      return this.groupsMapper.toDto(group);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'A group with this WhatsApp ID already exists'
          );
        }
      }
      throw error;
    }
  }

  /**
   * Update a group
   * @param id - Group ID
   * @param updateGroupDto - Group update data
   * @returns Updated group
   * @throws NotFoundException if group not found
   * @throws BadRequestException if validation fails
   */
  async update(
    id: string,
    updateGroupDto: GroupsUpdateDto
  ): Promise<GroupsResponseDto> {
    try {
      const data = this.groupsMapper.toEntityFromUpdate(updateGroupDto);
      const group = await this.prisma.group.update({
        where: { id },
        data,
      });

      return this.groupsMapper.toDto(group);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Activate a group
   * @param id - Group ID
   * @returns Updated group
   * @throws NotFoundException if group not found
   */
  async activate(id: string): Promise<GroupsResponseDto> {
    try {
      // Get the current group to check status before update
      const currentGroup = await this.prisma.group.findUnique({
        where: { id },
      });

      if (!currentGroup) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }

      // Check if group is already active
      if (currentGroup.status === GroupStatus.ACTIVE) {
        this.logger.log(`Group ${currentGroup.name} (${id}) is already active`);
        return this.groupsMapper.toDto(currentGroup);
      }

      // Update the group status to active
      const group = await this.prisma.group.update({
        where: { id },
        data: { status: GroupStatus.ACTIVE },
      });

      const groupDto = this.groupsMapper.toDto(group);

      // Send the activation message
      try {
        await this.groupMessagesService.sendGroupAddedEnabledMessage(
          group.whatsappGroupId,
          group.name
        );
        this.logger.log(
          `Sent activation message to group ${group.name} (${group.whatsappGroupId})`
        );
      } catch (error) {
        this.logger.error(
          `Failed to send activation message to group ${group.name}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
        // Continue processing even if sending message fails
      }

      return groupDto;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Deactivate a group
   * @param id - Group ID
   * @returns Updated group
   * @throws NotFoundException if group not found
   */
  async deactivate(id: string): Promise<GroupsResponseDto> {
    try {
      // Get the current group to check status before update
      const currentGroup = await this.prisma.group.findUnique({
        where: { id },
      });

      if (!currentGroup) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }

      // Check if group is already inactive
      if (currentGroup.status === GroupStatus.INACTIVE) {
        this.logger.log(
          `Group ${currentGroup.name} (${id}) is already inactive`
        );
        return this.groupsMapper.toDto(currentGroup);
      }

      // Update the group status to inactive
      const group = await this.prisma.group.update({
        where: { id },
        data: { status: GroupStatus.INACTIVE },
      });

      this.logger.log(`Group ${group.name} (${id}) has been deactivated`);
      return this.groupsMapper.toDto(group);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Remove a group
   * @param id - Group ID
   * @throws NotFoundException if group not found
   */
  async remove(id: string): Promise<void> {
    try {
      await this.prisma.group.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Find a group by WhatsApp ID
   * @param whatsappGroupId WhatsApp group ID
   * @returns The found group
   * @throws NotFoundException if group not found
   */
  async findByWhatsAppId(whatsappGroupId: string): Promise<GroupsResponseDto> {
    const group = await this.prisma.group.findFirst({
      where: { whatsappGroupId },
    });

    if (!group) {
      throw new NotFoundException(
        `Group with WhatsApp ID ${whatsappGroupId} not found`
      );
    }

    return this.groupsMapper.toDto(group);
  }

  /**
   * Find a group by WhatsApp ID or create it if it doesn't exist
   * @param whatsappGroupId WhatsApp group ID
   * @param groupName Group name, used if group is created
   * @param description Optional description, used if group is created
   * @returns The found or created group
   */
  async findOrCreateByWhatsAppId(
    whatsappGroupId: string,
    groupName = 'WhatsApp Group',
    description?: string
  ): Promise<GroupsResponseDto> {
    const group = await this.prisma.group.findFirst({
      where: { whatsappGroupId },
    });

    if (group) {
      this.logger.log(
        `Found existing group with WhatsApp ID ${whatsappGroupId}`
      );
      return this.groupsMapper.toDto(group);
    }

    this.logger.log(`Creating new group with WhatsApp ID ${whatsappGroupId}`);
    return this.create({
      whatsappGroupId,
      name: groupName,
      description,
    });
  }

  /**
   * Update the consent message ID for a group
   * @param whatsappGroupId WhatsApp group ID
   * @param consentMessageId The serialized message ID of the consent message
   * @returns The updated group
   * @throws NotFoundException if group not found
   */
  async updateConsentMessageId(
    whatsappGroupId: string,
    consentMessageId: string
  ): Promise<GroupsResponseDto> {
    try {
      this.logger.log(
        `Updating consent message ID for group with WhatsApp ID ${whatsappGroupId}`
      );

      // Find the group by WhatsApp ID
      const group = await this.prisma.group.findFirst({
        where: { whatsappGroupId },
      });

      if (!group) {
        throw new NotFoundException(
          `Group with WhatsApp ID ${whatsappGroupId} not found`
        );
      }

      // Update the group with the consent message ID
      const updatedGroup = await this.prisma.group.update({
        where: { id: group.id },
        data: {
          consentMessageId,
        },
      });

      this.logger.log(
        `Successfully updated consent message ID for group ${group.id}`
      );

      return this.groupsMapper.toDto(updatedGroup);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to update consent message ID: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );

      throw new BadRequestException(
        `Failed to update consent message ID: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
