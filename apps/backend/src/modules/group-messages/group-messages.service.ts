import { Injectable, NotFoundException } from '@nestjs/common';
import { ContextLogger } from 'nestjs-context-logger';
import { OutboundMessageService } from '../outbound-messages/services/outbound-message.service';
import { SystemMessagesService } from '../system-messages/system-messages.service';

@Injectable()
export class GroupMessagesService {
  private readonly logger = new ContextLogger(GroupMessagesService.name);

  constructor(
    private readonly systemMessagesService: SystemMessagesService,
    private readonly outboundMessageService: OutboundMessageService
  ) {}

  /**
   * Send a welcome message to a group when Shula is first added but disabled
   * @param groupId WhatsApp Group ID
   * @param groupName Group name
   */
  async sendGroupAddedDisabledMessage(
    groupId: string,
    groupName: string
  ): Promise<void> {
    try {
      // Get the GROUP_ADDED_DISABLED system message
      const message = await this.systemMessagesService.renderSystemMessage(
        'GROUP_ADDED_DISABLED',
        {
          groupName,
        }
      );

      // Send the message to the group
      await this.outboundMessageService.sendGroupMessage(
        groupId,
        message.content,
        undefined,
        {
          type: 'GROUP_ADDED_DISABLED',
          additionalData: {
            messageKey: 'GROUP_ADDED_DISABLED',
            isConsentMessage: true,
            saveMessageId: true,
          },
        },
        60 * 2 * 1000 // 2 minutes delay
      );

      this.logger.log(
        `Sent GROUP_ADDED_DISABLED message to group ${groupName} (${groupId})`
      );
    } catch (error) {
      if (
        error instanceof NotFoundException &&
        error.message.includes('GROUP_ADDED_DISABLED')
      ) {
        this.logger.warn(
          'GROUP_ADDED_DISABLED system message not found, using fallback message'
        );
        // Use a fallback message
        const fallbackMessage = `Hello! I am Shula, a WhatsApp bot for photo distribution. I have been added to this group but I'm currently inactive. Please contact the administrator to activate me.`;

        await this.outboundMessageService.sendGroupMessage(
          groupId,
          fallbackMessage,
          undefined,
          {
            type: 'GROUP_ADDED_DISABLED',
            additionalData: {
              messageKey: 'FALLBACK',
              isConsentMessage: true,
              saveMessageId: true,
            },
          }
        );
      } else {
        this.logger.error(
          `Failed to send GROUP_ADDED_DISABLED message: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          { error }
        );
        throw error;
      }
    }
  }

  /**
   * Send a welcome message to a group when Shula is activated
   * @param groupId WhatsApp Group ID
   * @param groupName Group name
   */
  async sendGroupAddedEnabledMessage(
    groupId: string,
    groupName: string
  ): Promise<void> {
    try {
      // Get the GROUP_ADDED_ENABLED system message
      const message = await this.systemMessagesService.renderSystemMessage(
        'GROUP_ADDED_ENABLED',
        {
          groupName,
        }
      );

      // Send the message to the group
      await this.outboundMessageService.sendGroupMessage(
        groupId,
        message.content,
        undefined,
        {
          type: 'GROUP_ADDED_ENABLED',
          additionalData: {
            messageKey: 'GROUP_ADDED_ENABLED',
          },
        }
      );

      this.logger.log(
        `Sent GROUP_ADDED_ENABLED message to group ${groupName} (${groupId})`
      );
    } catch (error) {
      if (
        error instanceof NotFoundException &&
        error.message.includes('GROUP_ADDED_ENABLED')
      ) {
        this.logger.warn(
          'GROUP_ADDED_ENABLED system message not found, using fallback message'
        );
        // Use a fallback message
        const fallbackMessage = `Hello everyone! Shula is now active in this group. I can help you share and distribute photos. Send an image, and I'll handle it for you!`;

        await this.outboundMessageService.sendGroupMessage(
          groupId,
          fallbackMessage,
          undefined,
          {
            type: 'GROUP_ADDED_ENABLED',
            additionalData: {
              messageKey: 'FALLBACK',
            },
          }
        );
      } else {
        this.logger.error(
          `Failed to send GROUP_ADDED_ENABLED message: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          { error }
        );
        throw error;
      }
    }
  }
}
