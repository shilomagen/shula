import { Injectable } from '@nestjs/common';
import { Participant } from '@prisma/client';
import { PaginatedParticipantsWithCountsResponseDto } from './dto/paginated-participants-with-counts-response.dto';
import {
  EnhancedGroupResponseDto,
  GroupPersonResponseDto,
  ParticipantContextResponseDto,
} from './dto/participant-context-response.dto';
import { ParticipantWithCountsResponseDto } from './dto/participant-with-counts-response.dto';
import { ParticipantsCreateDto } from './dto/participants-create.dto';
import { ParticipantsResponseDto } from './dto/participants-response.dto';
import { ParticipantsUpdateDto } from './dto/participants-update.dto';
import {
  EnhancedGroupInfo,
  GroupPersonInfo,
  ParticipantContext,
} from './participants.types';

/**
 * Mapper for Participant entity and DTOs
 */
@Injectable()
export class ParticipantsMapper {
  /**
   * Maps a Participant entity to a ParticipantsResponseDto
   * @param participant - The Participant entity to map
   * @returns The mapped ParticipantsResponseDto
   */
  toDto(participant: Participant): ParticipantsResponseDto {
    return {
      id: participant.id,
      phoneNumber: participant.phoneNumber,
      name: participant.name,
      status: participant.status,
      joinedAt: participant.joinedAt,
    };
  }

  /**
   * Maps a Participant entity to a ParticipantWithCountsResponseDto
   * @param participant - The Participant entity
   * @param groupsCount - Number of groups the participant is in
   * @param personsCount - Number of persons associated with the participant
   * @returns The mapped ParticipantWithCountsResponseDto
   */
  toDtoWithCounts(
    participant: Participant,
    groupsCount: number,
    personsCount: number
  ): ParticipantWithCountsResponseDto {
    return {
      ...this.toDto(participant),
      groupsCount,
      personsCount,
    };
  }

  /**
   * Maps a paginated result to a PaginatedParticipantsWithCountsResponseDto
   * @param results - The array of participant with counts
   * @param total - Total number of participants
   * @param page - Current page number
   * @param size - Page size
   * @returns The paginated response
   */
  toPaginatedWithCountsDto(
    results: ParticipantWithCountsResponseDto[],
    total: number,
    page: number,
    size: number
  ): PaginatedParticipantsWithCountsResponseDto {
    return {
      items: results,
      total,
      page,
      size,
      pages: Math.ceil(total / size),
    };
  }

  /**
   * Maps a ParticipantsCreateDto to a Participant entity
   * @param createParticipantDto - The DTO to map
   * @returns The mapped Participant entity
   */
  toEntityFromCreate(
    createParticipantDto: ParticipantsCreateDto
  ): Partial<Participant> {
    return {
      phoneNumber: createParticipantDto.phoneNumber,
      name: createParticipantDto.name,
    };
  }

  /**
   * Maps a ParticipantsUpdateDto to a Participant entity
   * @param updateParticipantDto - The DTO to map
   * @returns The mapped Participant entity
   */
  toEntityFromUpdate(
    updateParticipantDto: ParticipantsUpdateDto
  ): Partial<Participant> {
    return {
      name: updateParticipantDto.name,
    };
  }

  /**
   * Convert a domain ParticipantContext to a DTO
   * @param context - The domain participant context
   * @returns The participant context DTO
   */
  toContextResponseDto(
    context: ParticipantContext
  ): ParticipantContextResponseDto {
    return {
      name: context.name,
      groups: context.groups.map((group) => this.toGroupResponseDto(group)),
    };
  }

  /**
   * Convert a domain EnhancedGroupInfo to a DTO
   * @param group - The domain group info
   * @returns The group response DTO
   */
  private toGroupResponseDto(
    group: EnhancedGroupInfo
  ): EnhancedGroupResponseDto {
    return {
      id: group.id,
      name: group.name,
      persons: group.persons.map((person) => this.toPersonResponseDto(person)),
    };
  }

  /**
   * Convert a domain GroupPersonInfo to a DTO
   * @param person - The domain person info
   * @returns The person response DTO
   */
  private toPersonResponseDto(person: GroupPersonInfo): GroupPersonResponseDto {
    return {
      id: person.id,
      name: person.name,
    };
  }
}
