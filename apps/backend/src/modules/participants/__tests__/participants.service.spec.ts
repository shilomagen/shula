import { GroupFixture, PersonFixture } from './fixtures/participants.fixture';
import { ParticipantsServiceTestDriver } from './participants.service.driver';

describe('ParticipantsService', () => {
  let driver: ReturnType<typeof ParticipantsServiceTestDriver>;

  beforeEach(async () => {
    driver = ParticipantsServiceTestDriver();
    await driver.init();
  });

  afterEach(async () => {
    await driver.cleanup();
  });

  describe('buildParticipantContext', () => {
    const participantId = 'participant-123';
    const participantName = 'Test Participant';

    it('should build context with persons correctly organized by groups', async () => {
      // Arrange
      const groups = GroupFixture.multiple(2);

      // Create persons with specific groupIds
      const personGroup1A = PersonFixture.valid({
        id: 'person-1-a',
        name: 'Person 1A',
        groupId: groups[0].id,
      });

      const personGroup1B = PersonFixture.valid({
        id: 'person-1-b',
        name: 'Person 1B',
        groupId: groups[0].id,
      });

      const personGroup2 = PersonFixture.valid({
        id: 'person-2',
        name: 'Person 2',
        groupId: groups[1].id,
      });

      const participantPersons = [personGroup1A, personGroup1B, personGroup2];

      // Set up mock
      driver.given.participantWithData(
        participantId,
        groups,
        participantPersons
      );

      // Act
      const result = await driver.when.buildParticipantContext(
        participantId,
        participantName
      );

      // Assert
      expect(result).toEqual({
        name: participantName,
        groups: [
          {
            id: groups[0].id,
            name: groups[0].name,
            persons: [
              {
                id: personGroup1A.id,
                name: personGroup1A.name,
              },
              {
                id: personGroup1B.id,
                name: personGroup1B.name,
              },
            ],
          },
          {
            id: groups[1].id,
            name: groups[1].name,
            persons: [
              {
                id: personGroup2.id,
                name: personGroup2.name,
              },
            ],
          },
        ],
      });

      // Verify service call
      expect(driver.get.wasParticipantFindUniqueCalledWith(participantId)).toBe(
        true
      );
    });

    it('should return empty persons array when no persons are associated with a group', async () => {
      // Arrange
      const groups = GroupFixture.multiple(2);

      // Only create persons for the first group
      const personGroup1A = PersonFixture.valid({
        id: 'person-1-a',
        name: 'Person 1A',
        groupId: groups[0].id,
      });

      const personGroup1B = PersonFixture.valid({
        id: 'person-1-b',
        name: 'Person 1B',
        groupId: groups[0].id,
      });

      const participantPersons = [personGroup1A, personGroup1B];

      // Set up mock
      driver.given.participantWithData(
        participantId,
        groups,
        participantPersons
      );

      // Act
      const result = await driver.when.buildParticipantContext(
        participantId,
        participantName
      );

      // Assert
      expect(result).toEqual({
        name: participantName,
        groups: [
          {
            id: groups[0].id,
            name: groups[0].name,
            persons: [
              {
                id: personGroup1A.id,
                name: personGroup1A.name,
              },
              {
                id: personGroup1B.id,
                name: personGroup1B.name,
              },
            ],
          },
          {
            id: groups[1].id,
            name: groups[1].name,
            persons: [], // No persons for the second group
          },
        ],
      });

      // Verify service call
      expect(driver.get.wasParticipantFindUniqueCalledWith(participantId)).toBe(
        true
      );
    });

    it('should return empty groups array when participant does not belong to any groups', async () => {
      // Arrange
      const participantPersons = PersonFixture.multiple(2).map((person) => ({
        ...person,
        groupId: 'some-group-id',
      }));

      // Set up mock - participant doesn't belong to any groups
      driver.given.participantWithData(participantId, [], participantPersons);

      // Act
      const result = await driver.when.buildParticipantContext(
        participantId,
        participantName
      );

      // Assert
      expect(result).toEqual({
        name: participantName,
        groups: [], // No groups should be included
      });

      // Verify service call
      expect(driver.get.wasParticipantFindUniqueCalledWith(participantId)).toBe(
        true
      );
    });

    it('should handle multiple groups with persons correctly', async () => {
      // Arrange
      const groups = GroupFixture.multiple(3);

      // Create persons with different groupIds
      const personsGroup1 = [
        PersonFixture.valid({
          id: 'person-1-a',
          name: 'Person 1A',
          groupId: groups[0].id,
        }),
        PersonFixture.valid({
          id: 'person-1-b',
          name: 'Person 1B',
          groupId: groups[0].id,
        }),
      ];

      const personsGroup2 = [
        PersonFixture.valid({
          id: 'person-2',
          name: 'Person 2',
          groupId: groups[1].id,
        }),
      ];

      const personsGroup3 = [
        PersonFixture.valid({
          id: 'person-3-a',
          name: 'Person 3A',
          groupId: groups[2].id,
        }),
        PersonFixture.valid({
          id: 'person-3-b',
          name: 'Person 3B',
          groupId: groups[2].id,
        }),
        PersonFixture.valid({
          id: 'person-3-c',
          name: 'Person 3C',
          groupId: groups[2].id,
        }),
      ];

      const participantPersons = [
        ...personsGroup1,
        ...personsGroup2,
        ...personsGroup3,
      ];

      // Set up mock
      driver.given.participantWithData(
        participantId,
        groups,
        participantPersons
      );

      // Act
      const result = await driver.when.buildParticipantContext(
        participantId,
        participantName
      );

      // Assert
      expect(result).toEqual({
        name: participantName,
        groups: [
          {
            id: groups[0].id,
            name: groups[0].name,
            persons: personsGroup1.map((p) => ({ id: p.id, name: p.name })),
          },
          {
            id: groups[1].id,
            name: groups[1].name,
            persons: personsGroup2.map((p) => ({ id: p.id, name: p.name })),
          },
          {
            id: groups[2].id,
            name: groups[2].name,
            persons: personsGroup3.map((p) => ({ id: p.id, name: p.name })),
          },
        ],
      });

      // Verify service call
      expect(driver.get.wasParticipantFindUniqueCalledWith(participantId)).toBe(
        true
      );
    });
  });
});
