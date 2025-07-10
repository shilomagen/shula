import { ActionType } from '../../../actions/actions';
import { EscalationAction } from '../../../actions/escalation';

/**
 * Fixture for EscalationAction
 */
export class EscalationActionFixture {
  /**
   * Create a valid EscalationAction with default values
   */
  static valid(overrides: Partial<EscalationAction> = {}): EscalationAction {
    return {
      action: ActionType.ESCALATION,
      content: {
        issue: 'Test issue that needs escalation',
        priority: 'medium',
      },
      successMessage: 'Issue has been escalated successfully',
      errorMessage: 'Failed to escalate issue',
      ...overrides,
    };
  }

  /**
   * Create an EscalationAction with specific issue, priority and group ID
   */
  static withIssueAndPriority(
    issue: string,
    priority: string,
    overrides: Partial<Omit<EscalationAction, 'content'>> = {}
  ): EscalationAction {
    return this.valid({
      content: {
        issue,
        priority,
      },
      ...overrides,
    });
  }
}
