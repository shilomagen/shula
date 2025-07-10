import { Injectable } from '@nestjs/common';
import { ContextLogger } from 'nestjs-context-logger';
import { OutboundMessageService } from '../../../../outbound-messages/services/outbound-message.service';
import { ActionType, BaseAction } from '../actions/actions';
import { EscalationAction } from '../actions/escalation';
import { ActionHandler, ActionResult } from './action-handler.interface';

@Injectable()
export class EscalationActionHandler
  implements ActionHandler<EscalationAction>
{
  private readonly logger = new ContextLogger(EscalationActionHandler.name);
  private readonly DEFAULT_GROUP_ID = '120363414616640549@g.us';

  constructor(
    private readonly outboundMessageService: OutboundMessageService
  ) {}

  canHandle(action: BaseAction): boolean {
    return (action as any).action === ActionType.ESCALATION;
  }

  async execute(
    action: EscalationAction,
    participantId: string
  ): Promise<ActionResult> {
    try {
      this.logger.info('In Escalation action', { action });
      const { issue, priority } = action.content;
      // Use the provided group ID or fall back to the default
      const groupId = this.DEFAULT_GROUP_ID;

      // Format the message based on priority and issue
      const message = `*ESCALATION*\n\n*Priority:* ${priority}\n*Issue:* ${issue}\n*Reported by:* ${participantId}`;

      // Send the message to the specified group
      await this.outboundMessageService.sendGroupMessage(
        groupId,
        message,
        undefined,
        {
          type: 'ESCALATION',
          sourceId: participantId,
          additionalData: {
            issue,
            priority,
            escalatedAt: new Date().toISOString(),
          },
        }
      );

      this.logger.info('Escalation action completed', { action });
      return {
        success: true,
        message:
          action.successMessage || 'Issue has been escalated successfully.',
        data: {
          issue,
          priority,
          groupId,
          escalatedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      this.logger.error('Error in EscalationActionHandler:', { error });
      return {
        success: false,
        message:
          action.errorMessage ||
          `Failed to escalate issue: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        data: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}
