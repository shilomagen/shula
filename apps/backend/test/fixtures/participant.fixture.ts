import { faker } from '@faker-js/faker';
import { merge } from 'lodash';
import { EntityStatus } from '@prisma/client';

export interface CreateParticipantParams {
  phoneNumber?: string;
  name?: string;
  status?: EntityStatus;
}

export class ParticipantFixture {
  /**
   * Creates a valid participant with default values
   * @param overrides Fields to override in the default participant
   * @returns A valid participant object
   */
  static valid(
    overrides: CreateParticipantParams = {}
  ): CreateParticipantParams {
    const defaultParticipant: CreateParticipantParams = {
      phoneNumber: `+${faker.string.numeric(11)}`,
      name: faker.person.fullName(),
      status: EntityStatus.active,
    };

    return merge({}, defaultParticipant, overrides);
  }

  /**
   * Creates an invalid participant for negative testing
   * @returns An invalid participant object
   */
  static invalid(): CreateParticipantParams {
    return {
      phoneNumber: 'invalid-phone',
      name: '',
    };
  }

  /**
   * Generates multiple valid participants
   * @param count Number of participants to generate
   * @param overrides Common overrides to apply to all participants
   * @returns Array of valid participant data
   */
  static validList(
    count: number,
    overrides: CreateParticipantParams = {}
  ): CreateParticipantParams[] {
    return Array.from({ length: count }, () => this.valid(overrides));
  }
}
