import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityStatus, Prisma } from '@prisma/client';
import { ContextLogger } from 'nestjs-context-logger';
import { PaginatedResponseDto } from '../../common/dtos/paginated-response.dto';
import { PaginationDto } from '../../common/dtos/pagination.dto';
import { formatPhoneNumber } from '../../common/utils';
import { PrismaService } from '../../database/prisma.service';
import { ParticipantWithCountsResponseDto } from './dto/participant-with-counts-response.dto';
import { ParticipantsCreateDto } from './dto/participants-create.dto';
import { ParticipantsResponseDto } from './dto/participants-response.dto';
import { ParticipantsUpdateStatusDto } from './dto/participants-update-status.dto';
import { ParticipantsUpdateDto } from './dto/participants-update.dto';
import { ParticipantsMapper } from './participants.mapper';
import { EnhancedGroupInfo, ParticipantContext } from './participants.types';
import { MetricsService } from '@shula/observability';

@Injectable()
export class ParticipantsService {
  private readonly logger = new ContextLogger(ParticipantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    public readonly participantsMapper: ParticipantsMapper,
    private readonly metricsService: MetricsService
  ) {}

  /**
   * Find all participants
   * @returns Array of participants
   */
  async findAll(): Promise<ParticipantsResponseDto[]> {
    const participants = await this.prisma.participant.findMany();
    return participants.map((participant) =>
      this.participantsMapper.toDto(participant)
    );
  }

  /**
   * Find a participant by ID
   * @param id - Participant ID
   * @returns The found participant
   * @throws NotFoundException if participant not found
   */
  async findById(id: string): Promise<ParticipantsResponseDto> {
    const participant = await this.prisma.participant.findUnique({
      where: { id },
    });

    if (!participant) {
      throw new NotFoundException(`Participant with ID ${id} not found`);
    }

    return this.participantsMapper.toDto(participant);
  }

  /**
   * Find a participant by phone number
   * @param phoneNumber - Participant phone number
   * @returns The found participant or null if not found
   */
  async findByPhoneNumber(
    phoneNumber: string
  ): Promise<ParticipantsResponseDto | null> {
    // Format the phone number to ensure consistency
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    const participant = await this.prisma.participant.findUnique({
      where: { phoneNumber: formattedPhoneNumber },
    });

    if (!participant) {
      return null;
    }

    return this.participantsMapper.toDto(participant);
  }

  /**
   * Find a participant by phone number or create it if it doesn't exist
   * @param phoneNumber - Participant phone number
   * @param name - Participant name, used if participant is created
   * @returns The found or created participant
   */
  async findOrCreateByPhoneNumber(
    phoneNumber: string,
    name = 'Unknown'
  ): Promise<ParticipantsResponseDto> {
    // Format the phone number to ensure consistency
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    const existingParticipant = await this.findByPhoneNumber(
      formattedPhoneNumber
    );

    if (existingParticipant) {
      this.logger.log(
        `Found existing participant with phone number ${formattedPhoneNumber}`
      );
      return existingParticipant;
    }

    this.logger.log(
      `Creating new participant with phone number ${formattedPhoneNumber}`
    );
    return this.create({
      phoneNumber: formattedPhoneNumber,
      name,
    });
  }

  /**
   * Find participants by group ID
   * @param groupId - Group ID
   * @returns Array of participants in the group
   */
  async findByGroupId(groupId: string): Promise<ParticipantsResponseDto[]> {
    const participants = await this.prisma.participant.findMany({
      where: {
        groups: {
          some: {
            groupId,
          },
        },
      },
    });

    return participants.map((participant) =>
      this.participantsMapper.toDto(participant)
    );
  }

  /**
   * Create a new participant
   * @param createParticipantDto - Data to create participant
   * @returns The created participant
   */
  async create(
    createParticipantDto: ParticipantsCreateDto
  ): Promise<ParticipantsResponseDto> {
    // Format the phone number to ensure consistency
    const formattedDto = {
      ...createParticipantDto,
      phoneNumber: formatPhoneNumber(createParticipantDto.phoneNumber),
    };

    const participant = await this.prisma.participant.create({
      data: {
        phoneNumber: formattedDto.phoneNumber,
        name: formattedDto.name,
      },
    });
    this.metricsService.incrementCounter('participant_creation_total', 1, {});
    return this.participantsMapper.toDto(participant);
  }

  /**
   * Update a participant
   * @param id - Participant ID
   * @param updateParticipantDto - Data to update participant
   * @returns The updated participant
   * @throws NotFoundException if participant not found
   */
  async update(
    id: string,
    updateParticipantDto: ParticipantsUpdateDto
  ): Promise<ParticipantsResponseDto> {
    await this.findById(id); // Check if participant exists

    const data =
      this.participantsMapper.toEntityFromUpdate(updateParticipantDto);
    const updatedParticipant = await this.prisma.participant.update({
      where: { id },
      data,
    });

    return this.participantsMapper.toDto(updatedParticipant);
  }

  /**
   * Update participant status
   * @param id - Participant ID
   * @param updateStatusDto - Status data
   * @returns The updated participant
   * @throws NotFoundException if participant not found
   */
  async updateStatus(
    id: string,
    updateStatusDto: ParticipantsUpdateStatusDto
  ): Promise<ParticipantsResponseDto> {
    await this.findById(id); // Check if participant exists

    const updatedParticipant = await this.prisma.participant.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
      },
    });

    return this.participantsMapper.toDto(updatedParticipant);
  }

  /**
   * Delete a participant
   * @param id - Participant ID
   * @returns The deleted participant
   * @throws NotFoundException if participant not found
   */
  async delete(id: string): Promise<ParticipantsResponseDto> {
    await this.findById(id); // Check if participant exists

    const deletedParticipant = await this.prisma.participant.delete({
      where: { id },
    });

    return this.participantsMapper.toDto(deletedParticipant);
  }

  /**
   * Add participant to a group
   * @param participantId - Participant ID
   * @param groupId - Group ID
   * @returns The updated participant
   */
  async addToGroup(
    participantId: string,
    groupId: string
  ): Promise<ParticipantsResponseDto> {
    await this.findById(participantId); // Check if participant exists

    try {
      await this.prisma.groupParticipant.create({
        data: {
          groupId,
          participantId,
        },
      });
    } catch (error) {
      // If the relation already exists, we can ignore this error
      if (
        !(error instanceof Error && error.message.includes('already exists'))
      ) {
        throw error;
      }
      this.logger.log(
        `Participant ${participantId} is already in group ${groupId}`
      );
    }

    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      throw new NotFoundException(
        `Participant with ID ${participantId} not found`
      );
    }

    return this.participantsMapper.toDto(participant);
  }

  /**
   * Find or create participant by phone number and add them to a group
   * @param phoneNumber - Participant phone number
   * @param groupId - Group ID
   * @param name - Optional participant name, used if participant is created
   * @returns The participant
   */
  async findOrCreateAndAddToGroup(
    phoneNumber: string,
    groupId: string,
    name = 'Unknown'
  ): Promise<ParticipantsResponseDto> {
    const participant = await this.findOrCreateByPhoneNumber(phoneNumber, name);
    await this.addToGroup(participant.id, groupId);
    return participant;
  }

  /**
   * Remove participant from a group
   * @param participantId - Participant ID
   * @param groupId - Group ID
   * @returns The updated participant
   */
  async removeFromGroup(
    participantId: string,
    groupId: string
  ): Promise<ParticipantsResponseDto> {
    await this.findById(participantId); // Check if participant exists

    await this.prisma.groupParticipant.delete({
      where: {
        groupId_participantId: {
          groupId,
          participantId,
        },
      },
    });

    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
    });

    if (!participant) {
      throw new NotFoundException(
        `Participant with ID ${participantId} not found`
      );
    }

    return this.participantsMapper.toDto(participant);
  }

  /**
   * Build participant context with enhanced group information
   * @param participantId - The participant ID
   * @param participantName - The participant's name
   * @returns The participant context with groups and their related persons
   */
  async buildParticipantContext(
    participantId: string,
    participantName: string
  ): Promise<ParticipantContext> {
    this.logger.debug(`Building context for participant: ${participantId}`);

    // Get all data in a single query
    const participantWithData = await this.prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        // Include all groups the participant belongs to
        groups: {
          include: {
            group: true,
          },
        },
        // Include all persons associated with this participant
        persons: true,
      },
    });

    if (!participantWithData) {
      throw new NotFoundException(
        `Participant with ID ${participantId} not found`
      );
    }

    // Extract groups and persons from the query result
    const groups = participantWithData.groups.map((gp) => gp.group);
    const persons = participantWithData.persons;

    // Build enhanced group info with persons from this participant
    const enhancedGroups: EnhancedGroupInfo[] = groups.map((group) => {
      // Filter persons by groupId
      const groupPersons = persons.filter(
        (person) => person.groupId === group.id
      );

      return {
        id: group.id,
        name: group.name,
        persons: groupPersons.map((person) => ({
          id: person.id,
          name: person.name,
        })),
      };
    });

    return {
      name: participantName,
      groups: enhancedGroups,
    };
  }

  /**
   * Find a participant by person ID and group ID
   * @param personId - The ID of the person
   * @param groupId - The ID of the group
   * @returns The participant data or null if not found
   */
  async findParticipantByPersonId(
    personId: string,
    groupId: string
  ): Promise<ParticipantsResponseDto | null> {
    // Find the participant directly by querying participants with a relation to the specified person
    const participant = await this.prisma.participant.findFirst({
      where: {
        persons: {
          some: {
            id: personId,
            groupId,
          },
        },
      },
    });

    if (!participant) {
      return null;
    }

    return this.participantsMapper.toDto(participant);
  }

  /**
   * Query participants with pagination and filters, with group and person counts
   * @param pagination - Pagination parameters
   * @param filters - Optional filters for name, phone number, and status
   * @returns Paginated list of participants with counts
   */
  async queryParticipantsWithCounts(
    pagination: PaginationDto,
    filters?: {
      name?: string;
      phoneNumber?: string;
      status?: EntityStatus;
    }
  ): Promise<PaginatedResponseDto<ParticipantWithCountsResponseDto>> {
    const { page = 1, size = 10 } = pagination;
    const skip = (page - 1) * size;

    // Build where conditions based on filters
    const whereConditions: Prisma.ParticipantWhereInput = {};

    if (filters?.name) {
      whereConditions.name = {
        contains: filters.name,
        mode: 'insensitive', // Case insensitive search
      };
    }

    if (filters?.phoneNumber) {
      whereConditions.phoneNumber = {
        contains: filters.phoneNumber,
      };
    }

    if (filters?.status) {
      whereConditions.status = filters.status;
    }

    // Get the total count of participants matching the filters
    const totalParticipants = await this.prisma.participant.count({
      where: whereConditions,
    });

    // Get the participants with pagination
    const participants = await this.prisma.participant.findMany({
      where: whereConditions,
      skip,
      take: size,
      orderBy: { joinedAt: 'desc' }, // Order by join date, newest first
    });

    // For each participant, get the counts of groups and persons
    const participantsWithCounts = await Promise.all(
      participants.map(async (participant) => {
        // Count groups for this participant
        const groupsCount = await this.prisma.groupParticipant.count({
          where: {
            participantId: participant.id,
          },
        });

        // Count persons associated with this participant across all groups
        const personsCount = await this.prisma.person.count({
          where: {
            participantId: participant.id,
          },
        });

        // Map to DTO with counts
        return this.participantsMapper.toDtoWithCounts(
          participant,
          groupsCount,
          personsCount
        );
      })
    );

    // Return paginated response
    return this.participantsMapper.toPaginatedWithCountsDto(
      participantsWithCounts,
      totalParticipants,
      page,
      size
    );
  }
}
