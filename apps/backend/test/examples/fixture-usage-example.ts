/**
 * This file provides examples of how to use the fixtures in tests
 * It's not meant to be executed, but serves as documentation
 */

import { PrismaClient } from '@prisma/client';
import { GroupFixture, ParticipantFixture, PersonFixture } from '../fixtures';

/**
 * Example of creating a simple group with no participants
 */
async function createSimpleGroup(prisma: PrismaClient) {
  return await prisma.group.create({
    data: GroupFixture.valid({
      name: 'Custom Group Name',
    }),
  });
}

/**
 * Example of creating a group with participants
 */
async function createGroupWithParticipants(prisma: PrismaClient) {
  // Create participants with specific overrides
  const participants = [
    ParticipantFixture.valid({ name: 'John Doe' }),
    ParticipantFixture.valid({ phoneNumber: '+1234567890' }),
  ];

  // Use the helper method to create a group with participants
  return await prisma.group.create({
    data: GroupFixture.withParticipants(
      { name: 'Group with Participants' },
      participants
    ),
    include: {
      participants: {
        include: {
          participant: true,
        },
      },
    },
  });
}

/**
 * Example of creating a list of participants
 */
async function createMultipleParticipants(prisma: PrismaClient) {
  // Generate 5 participants with default values
  const participants = ParticipantFixture.validList(5);

  // Bulk create participants
  return await prisma.participant.createMany({
    data: participants,
  });
}

/**
 * Example of creating persons associated with participants
 */
async function createPersonsForParticipant(
  prisma: PrismaClient,
  participantId: string,
  groupId: string
) {
  // Create 3 persons with faces for the participant
  const persons = [
    PersonFixture.withFaces(2, {
      participantId,
      groupId,
      name: 'Person with 2 faces',
    }),
    PersonFixture.withFaces(1, {
      participantId,
      groupId,
      name: 'Person with 1 face',
    }),
    PersonFixture.valid({
      participantId,
      groupId,
      name: 'Person with no faces',
    }),
  ];

  // Create each person
  const createdPersons = [];
  for (const person of persons) {
    createdPersons.push(
      await prisma.person.create({
        data: person,
      })
    );
  }

  return createdPersons;
}

/**
 * Complex example that creates a full test environment
 */
async function setupCompleteTestData(prisma: PrismaClient) {
  // Create 2 groups with 3 participants each
  const groups = [];

  for (let i = 0; i < 2; i++) {
    const participants = ParticipantFixture.validList(3);

    const group = await prisma.group.create({
      data: GroupFixture.withParticipants(
        { name: `Test Group ${i + 1}` },
        participants
      ),
      include: {
        participants: {
          include: {
            participant: true,
          },
        },
      },
    });

    groups.push(group);

    // For each participant, create 2 persons
    for (const groupParticipant of group.participants) {
      const participantId = groupParticipant.participant.id;

      await createPersonsForParticipant(prisma, participantId, group.id);
    }
  }

  return groups;
}

// Export examples for documentation purposes
export const examples = {
  createSimpleGroup,
  createGroupWithParticipants,
  createMultipleParticipants,
  createPersonsForParticipant,
  setupCompleteTestData,
};
