import { faker } from '@faker-js/faker';
import { merge } from 'lodash';
import { EntityStatus } from '@prisma/client';

export interface CreatePersonParams {
  participantId?: string;
  groupId?: string;
  name?: string;
  status?: EntityStatus;
  faceIds?: string[];
  rekognitionCollectionId?: string;
}

export class PersonFixture {
  /**
   * Creates a valid person with default values
   * @param overrides Fields to override in the default person
   * @returns A valid person object
   */
  static valid(overrides: CreatePersonParams = {}): CreatePersonParams {
    const defaultPerson: CreatePersonParams = {
      name: faker.person.fullName(),
      status: EntityStatus.active,
      faceIds: [],
    };

    return merge({}, defaultPerson, overrides);
  }

  /**
   * Creates an invalid person for negative testing
   * @returns An invalid person object
   */
  static invalid(): CreatePersonParams {
    return {
      name: '',
    };
  }

  /**
   * Generates multiple valid persons
   * @param count Number of persons to generate
   * @param overrides Common overrides to apply to all persons
   * @returns Array of valid person data
   */
  static validList(
    count: number,
    overrides: CreatePersonParams = {}
  ): CreatePersonParams[] {
    return Array.from({ length: count }, () => this.valid(overrides));
  }

  /**
   * Creates a person with face IDs
   * @param faceCount Number of face IDs to generate
   * @param overrides Additional person overrides
   * @returns A person with face IDs
   */
  static withFaces(
    faceCount = 1,
    overrides: CreatePersonParams = {}
  ): CreatePersonParams {
    const faceIds = Array.from({ length: faceCount }, () =>
      faker.string.uuid()
    );
    return this.valid({
      ...overrides,
      faceIds,
    });
  }
}
