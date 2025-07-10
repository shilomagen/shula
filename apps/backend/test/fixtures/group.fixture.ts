import { faker } from '@faker-js/faker';
import { merge } from 'lodash';
import { EntityStatus, Group, GroupConsentStatus } from '@prisma/client';
import { CreateParticipantParams } from './participant.fixture';

export interface CreateGroupParams {
  whatsappGroupId?: string;
  name?: string;
  description?: string;
  status?: EntityStatus;
  consentStatus?: GroupConsentStatus;
}

export class GroupFixture {
  /**
   * Creates a valid group with default values
   * @param overrides Fields to override in the default group
   * @returns A valid group object
   */
  static valid(overrides: CreateGroupParams = {}): CreateGroupParams {
    const defaultGroup: CreateGroupParams = {
      whatsappGroupId: `group-${faker.string.uuid()}`,
      name: faker.company.name(),
      description: faker.lorem.sentence(),
      status: EntityStatus.active,
      consentStatus: GroupConsentStatus.pending,
    };

    return merge({}, defaultGroup, overrides);
  }

  /**
   * Creates an invalid group for negative testing
   * @returns An invalid group object
   */
  static invalid(): CreateGroupParams {
    return {
      whatsappGroupId: '',
      name: '',
    };
  }

  /**
   * Generates a complete create group input with participants
   * @param groupOverrides Group property overrides
   * @param participantsList List of participant data to include
   * @returns Complete group creation input
   */
  static withParticipants(
    groupOverrides: CreateGroupParams = {},
    participantsList: CreateParticipantParams[] = []
  ): any {
    const groupData = this.valid(groupOverrides);

    return {
      ...groupData,
      participants: {
        create: participantsList.map((participant) => ({
          participant: {
            create: participant,
          },
        })),
      },
    };
  }
}
