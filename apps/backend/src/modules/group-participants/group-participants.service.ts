import { Injectable } from '@nestjs/common';
import { Group } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

/**
 * Service for managing group participants
 */
@Injectable()
export class GroupParticipantsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find groups by participant ID
   * @param participantId - The participant ID
   * @returns Array of groups the participant belongs to
   */
  async findGroupsByParticipantId(participantId: string): Promise<Group[]> {
    const groupParticipants = await this.prisma.groupParticipant.findMany({
      where: { participantId },
      include: { group: true },
    });

    return groupParticipants.map((gp) => gp.group);
  }

  /**
   * Check if a participant is in a group
   * @param participantId - The participant ID
   * @param groupId - The group ID
   * @returns True if the participant is in the group, false otherwise
   */
  async isParticipantInGroup(
    participantId: string,
    groupId: string
  ): Promise<boolean> {
    const groupParticipant = await this.prisma.groupParticipant.findUnique({
      where: {
        groupId_participantId: {
          groupId,
          participantId,
        },
      },
    });

    return !!groupParticipant;
  }

  /**
   * Remove a participant from a group
   * @param participantId - The participant ID to remove
   * @param groupId - The group ID to remove from
   */
  async removeParticipantFromGroup(
    participantId: string,
    groupId: string
  ): Promise<void> {
    await this.prisma.groupParticipant.delete({
      where: {
        groupId_participantId: {
          groupId,
          participantId,
        },
      },
    });
  }
}
