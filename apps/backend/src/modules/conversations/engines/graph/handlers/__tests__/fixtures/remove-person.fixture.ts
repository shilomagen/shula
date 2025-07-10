import { ActionType } from '../../../actions/actions';
import { RemovePersonAction } from '../../../actions/remove-person';

/**
 * Fixture for RemovePersonAction
 */
export class RemovePersonActionFixture {
  /**
   * Create a valid RemovePersonAction with default values
   */
  static valid(
    overrides: Partial<RemovePersonAction> = {}
  ): RemovePersonAction {
    return {
      action: ActionType.REMOVE_PERSON,
      content: {
        personId: 'person-123',
        groupId: 'group-123',
      },
      successMessage: 'Person removed successfully',
      errorMessage: 'Failed to remove person',
      ...overrides,
    };
  }

  /**
   * Create a RemovePersonAction with specific person and group IDs
   */
  static withPersonAndGroup(
    personId: string,
    groupId: string,
    overrides: Partial<Omit<RemovePersonAction, 'content'>> = {}
  ): RemovePersonAction {
    return this.valid({
      content: {
        personId,
        groupId,
      },
      ...overrides,
    });
  }
}

/**
 * Fixture for Person data
 */
export class PersonFixture {
  /**
   * Create a valid Person with default values
   */
  static valid(overrides: Partial<any> = {}): any {
    return {
      id: 'person-123',
      name: 'Test Person',
      ...overrides,
    };
  }
}
