import { EntityStatus } from '../../../../common/enums/domain.enums';
import { merge } from 'lodash';

/**
 * Fixture for creating participant test data
 */
export class ParticipantFixture {
  static valid(overrides: Partial<any> = {}): any {
    const defaultParticipant = {
      id: 'participant-123',
      phoneNumber: '+1234567890',
      name: 'Test Participant',
      joinedAt: new Date(),
      status: EntityStatus.ACTIVE,
    };

    return merge({}, defaultParticipant, overrides);
  }
}

/**
 * Fixture for creating group test data
 */
export class GroupFixture {
  static valid(overrides: Partial<any> = {}): any {
    const defaultGroup = {
      id: 'group-123',
      name: 'Test Group',
      whatsappGroupId: 'whatsapp-group-123',
      description: 'A test group',
      createdAt: new Date(),
      status: EntityStatus.ACTIVE,
    };

    return merge({}, defaultGroup, overrides);
  }

  /**
   * Create multiple groups
   */
  static multiple(count: number): any[] {
    return Array.from({ length: count }, (_, i) =>
      this.valid({
        id: `group-${i + 1}`,
        name: `Test Group ${i + 1}`,
        whatsappGroupId: `whatsapp-group-${i + 1}`,
      })
    );
  }
}

/**
 * Fixture for creating person test data
 */
export class PersonFixture {
  static valid(overrides: Partial<any> = {}): any {
    const defaultPerson = {
      id: 'person-123',
      name: 'Test Person',
      createdAt: new Date(),
      status: EntityStatus.ACTIVE,
      faceIds: [],
      rekognitionCollectionId: 'collection-123',
    };

    return merge({}, defaultPerson, overrides);
  }

  /**
   * Create multiple persons
   */
  static multiple(count: number): any[] {
    return Array.from({ length: count }, (_, i) =>
      this.valid({
        id: `person-${i + 1}`,
        name: `Test Person ${i + 1}`,
      })
    );
  }
}

/**
 * Fixture for creating participant context test data
 */
export class ParticipantContextFixture {
  static valid(overrides: Partial<any> = {}): any {
    const defaultContext = {
      name: 'Test Participant',
      groups: [
        {
          id: 'group-123',
          name: 'Test Group',
          persons: [
            {
              id: 'person-123',
              name: 'Test Person',
            },
          ],
        },
      ],
    };

    return merge({}, defaultContext, overrides);
  }
}
