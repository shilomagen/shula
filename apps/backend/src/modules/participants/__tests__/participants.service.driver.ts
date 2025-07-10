import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { jest } from '@jest/globals';
import { PrismaService } from '../../../database/prisma.service';
import { ParticipantsService } from '../participants.service';
import { ParticipantsMapper } from '../participants.mapper';
import { GroupParticipantsService } from '../../group-participants/group-participants.service';
import { PersonsService } from '../../persons/persons.service';
import { ParticipantContext } from '../participants.types';
import { MetricsService } from '@shula/observability';
/**
 * Test driver for the ParticipantsService
 * Follows the driver pattern with given/when/get methods
 */
export function ParticipantsServiceTestDriver() {
  // Mock services
  const mockPrismaService = {
    participant: {
      findUnique: jest.fn(),
    },
  };
  const mockParticipantsMapper = mock<ParticipantsMapper>();
  const mockGroupParticipantsService = mock<GroupParticipantsService>();
  const mockPersonsService = mock<PersonsService>();
  const mockMetricsService = mock<MetricsService>();
  // Service instance
  let service: ParticipantsService;

  const init = async (): Promise<void> => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ParticipantsMapper, useValue: mockParticipantsMapper },
        { provide: MetricsService, useValue: mockMetricsService },
        {
          provide: GroupParticipantsService,
          useValue: mockGroupParticipantsService,
        },
        { provide: PersonsService, useValue: mockPersonsService },
      ],
    }).compile();

    service = moduleFixture.get<ParticipantsService>(ParticipantsService);
  };

  const cleanup = async (): Promise<void> => {
    jest.clearAllMocks();
  };

  const given = {
    /**
     * Set up the Prisma service to return a participant with groups and persons
     */
    participantWithData: (
      participantId: string,
      groups: any[],
      persons: any[]
    ): void => {
      mockPrismaService.participant.findUnique.mockResolvedValue({
        id: participantId,
        groups: groups.map((group) => ({
          group,
          groupId: group.id,
          participantId,
        })),
        persons,
        // These fields are required by Prisma but not used in our tests
        name: 'Test Participant',
        phoneNumber: '+1234567890',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    },

    /**
     * Set up the participants mapper to return a specific context response
     */
    mapperReturnsContextResponse: (
      context: ParticipantContext,
      response: any
    ): void => {
      mockParticipantsMapper.toContextResponseDto.mockReturnValue(response);
    },
  };

  const when = {
    /**
     * Build participant context
     */
    buildParticipantContext: async (
      participantId: string,
      participantName: string
    ): Promise<ParticipantContext> => {
      return service.buildParticipantContext(participantId, participantName);
    },
  };

  const get = {
    /**
     * Get the calls made to findUnique on participant
     */
    participantFindUniqueCalls: () =>
      mockPrismaService.participant.findUnique.mock.calls,

    /**
     * Check if findUnique on participant was called with a specific ID
     */
    wasParticipantFindUniqueCalledWith: (participantId: string): boolean => {
      return mockPrismaService.participant.findUnique.mock.calls.some(
        (call) => call[0]?.where?.id === participantId
      );
    },
  };

  return { init, cleanup, given, when, get };
}
