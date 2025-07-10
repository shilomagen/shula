import { Injectable, NotFoundException } from '@nestjs/common';
import { ConsentResponseType, GroupConsentStatus } from '@prisma/client';
import { ContextLogger } from 'nestjs-context-logger';
import { PrismaService } from '../../database/prisma.service';
import { CreateParticipantConsentDto } from './dto/create-participant-consent.dto';
import { ParticipantConsentResponseDto } from './dto/participant-consent-response.dto';
import { ParticipantConsentStatusResponseDto } from './dto/participant-consent-status-response.dto';
import { UpdateParticipantConsentDto } from './dto/update-participant-consent.dto';

@Injectable()
export class ParticipantConsentsService {
  private readonly logger = new ContextLogger(ParticipantConsentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find all consent records for a group
   * @param groupId Group ID
   * @returns List of consent records
   */
  async findByGroupId(
    groupId: string
  ): Promise<ParticipantConsentResponseDto[]> {
    try {
      const consents = await this.prisma.participantConsent.findMany({
        where: { groupId },
        include: {
          participant: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: {
          respondedAt: { sort: 'desc', nulls: 'last' },
        },
      });

      return consents.map((consent) => this.mapToResponseDto(consent));
    } catch (error) {
      this.logger.error(
        `Failed to find consents for group ${groupId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    }
  }

  /**
   * Find all consent records for a participant
   * @param participantId Participant ID
   * @returns List of consent records
   */
  async findByParticipantId(
    participantId: string
  ): Promise<ParticipantConsentResponseDto[]> {
    try {
      const consents = await this.prisma.participantConsent.findMany({
        where: { participantId },
        include: {
          participant: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
        },
        orderBy: {
          respondedAt: { sort: 'desc', nulls: 'last' },
        },
      });

      return consents.map((consent) => this.mapToResponseDto(consent));
    } catch (error) {
      this.logger.error(
        `Failed to find consents for participant ${participantId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    }
  }

  /**
   * Find a specific consent record
   * @param groupId Group ID
   * @param participantId Participant ID
   * @returns Consent record
   */
  async findOne(
    groupId: string,
    participantId: string
  ): Promise<ParticipantConsentResponseDto> {
    try {
      const consent = await this.prisma.participantConsent.findUnique({
        where: {
          groupId_participantId: {
            groupId,
            participantId,
          },
        },
        include: {
          participant: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
        },
      });

      if (!consent) {
        throw new NotFoundException(
          `Consent record not found for participant ${participantId} in group ${groupId}`
        );
      }

      return this.mapToResponseDto(consent);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Failed to find consent record: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    }
  }

  /**
   * Create a consent record
   * @param createDto Create consent DTO
   * @returns Created consent record
   */
  async create(
    createDto: CreateParticipantConsentDto
  ): Promise<ParticipantConsentResponseDto> {
    try {
      const { groupId, participantId, consentStatus } = createDto;

      this.logger.log(
        `Creating consent record for participant ${participantId} in group ${groupId}`
      );

      const existingRecord = await this.prisma.participantConsent.findUnique({
        where: {
          groupId_participantId: {
            groupId,
            participantId,
          },
        },
      });

      if (existingRecord) {
        this.logger.log(
          `Consent record already exists for participant ${participantId} in group ${groupId}`
        );
        return this.findOne(groupId, participantId);
      }

      const newConsent = await this.prisma.participantConsent.create({
        data: {
          groupId,
          participantId,
          consentStatus,
          respondedAt:
            consentStatus !== ConsentResponseType.pending ? new Date() : null,
        },
        include: {
          participant: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
        },
      });

      // Update group consent status if needed
      if (consentStatus !== ConsentResponseType.pending) {
        await this.updateGroupConsentStatus(groupId);
      }

      return this.mapToResponseDto(newConsent);
    } catch (error) {
      this.logger.error(
        `Failed to create consent record: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    }
  }

  /**
   * Create multiple consent records
   * @param createDtos Array of create consent DTOs
   * @returns Number of created records
   */
  async createMany(
    createDtos: CreateParticipantConsentDto[]
  ): Promise<{ count: number }> {
    const result = await this.prisma.participantConsent.createMany({
      data: createDtos,
      skipDuplicates: true,
    });

    return { count: result.count };
  }

  /**
   * Update a consent record
   * @param groupId Group ID
   * @param participantId Participant ID
   * @param updateDto Update consent DTO
   * @returns Updated consent record
   */
  async update(
    groupId: string,
    participantId: string,
    updateDto: UpdateParticipantConsentDto
  ): Promise<ParticipantConsentResponseDto> {
    try {
      this.logger.log(
        `Updating consent status for participant ${participantId} in group ${groupId} to ${updateDto.consentStatus}`
      );

      const updatedConsent = await this.prisma.participantConsent.update({
        where: {
          groupId_participantId: {
            groupId,
            participantId,
          },
        },
        data: {
          consentStatus: updateDto.consentStatus,
          respondedAt: new Date(),
        },
        include: {
          participant: {
            select: {
              name: true,
              phoneNumber: true,
            },
          },
        },
      });

      // Update group consent status
      await this.updateGroupConsentStatus(groupId);

      return this.mapToResponseDto(updatedConsent);
    } catch (error) {
      this.logger.error(
        `Failed to update consent status: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    }
  }

  /**
   * Calculate the current consent status for a group
   * @param groupId Group ID
   * @returns true if the group has enough consents to be considered approved
   */
  async calculateGroupConsentStatus(groupId: string): Promise<boolean> {
    try {
      const consentRecords = await this.prisma.participantConsent.findMany({
        where: { groupId },
      });
      return consentRecords.every(
        (record) => record.consentStatus === ConsentResponseType.accepted
      );
    } catch (error) {
      this.logger.error(
        `Failed to calculate group consent status: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    }
  }

  /**
   * Update the group's overall consent status based on participants' responses
   * @param groupId Group ID
   */
  async updateGroupConsentStatus(groupId: string): Promise<void> {
    try {
      const consensusStatus = await this.calculateGroupConsentStatus(groupId);

      await this.prisma.group.update({
        where: { id: groupId },
        data: {
          consentStatus: consensusStatus
            ? GroupConsentStatus.approved
            : GroupConsentStatus.rejected,
          consentCompletedAt: new Date(),
        },
      });

      this.logger.log(
        `Updated group ${groupId} consent status to ${
          consensusStatus ? 'approved' : 'rejected'
        }`
      );
    } catch (error) {
      this.logger.error(
        `Failed to update group consent status: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    }
  }

  /**
   * Map a Prisma ParticipantConsent model to a response DTO
   * @param consent Prisma ParticipantConsent model
   * @returns ParticipantConsentResponseDto
   */
  private mapToResponseDto(consent: any): ParticipantConsentResponseDto {
    return {
      id: consent.id,
      groupId: consent.groupId,
      participantId: consent.participantId,
      consentStatus: consent.consentStatus,
      respondedAt: consent.respondedAt,
      participantName: consent.participant?.name,
      participantPhoneNumber: consent.participant?.phoneNumber,
    };
  }

  async getParticipantsConsentStatus(
    groupId: string
  ): Promise<ParticipantConsentStatusResponseDto[]> {
    const consents = await this.findByGroupId(groupId);

    return consents.map((consent) => ({
      participantId: consent.participantId,
      groupId: consent.groupId,
      status: consent.consentStatus,
      updatedAt: consent.respondedAt || new Date(),
    }));
  }
}
