import { Injectable } from '@nestjs/common';
import { PendingMessageStatus, PendingMessageType } from '@prisma/client';
import { ContextLogger } from 'nestjs-context-logger';
import { PrismaService } from '../../database/prisma.service';
import { GroupMessagesService } from '../group-messages/group-messages.service';

/**
 * Service for managing pending messages
 */
@Injectable()
export class PendingMessagesService {
  private readonly logger = new ContextLogger(PendingMessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly groupMessagesService: GroupMessagesService
  ) {}

  /**
   * Create a new pending message
   * @param groupId - Database ID of the group
   * @param whatsappGroupId - WhatsApp ID of the group
   * @param messageType - Type of the pending message
   * @param groupName - Name of the group
   * @returns The created pending message
   */
  async createPendingMessage(
    groupId: string,
    whatsappGroupId: string,
    messageType: PendingMessageType,
    groupName: string
  ) {
    try {
      const pendingMessage = await this.prisma.pendingGroupMessage.create({
        data: {
          groupId,
          whatsappGroupId,
          messageType,
          groupName,
          status: PendingMessageStatus.PENDING,
        },
      });

      this.logger.log(
        `Created pending message ${pendingMessage.id} for group ${groupName} (${whatsappGroupId})`
      );

      return pendingMessage;
    } catch (error) {
      this.logger.error(
        `Failed to create pending message: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    }
  }

  /**
   * Process pending messages for a group when the bot becomes an admin
   * @param whatsappGroupId - WhatsApp ID of the group
   * @returns Promise<void>
   */
  async processPendingMessages(whatsappGroupId: string): Promise<void> {
    try {
      // Find any pending messages for this group
      const pendingMessages = await this.prisma.pendingGroupMessage.findMany({
        where: {
          whatsappGroupId,
          status: PendingMessageStatus.PENDING,
        },
      });

      this.logger.log(
        `Found ${pendingMessages.length} pending messages for group ${whatsappGroupId}`
      );

      // Process each pending message with a delay between them
      for (const [index, pendingMessage] of pendingMessages.entries()) {
        // Add a timeout between messages to avoid rate limiting
        if (index > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        try {
          await this.processPendingMessage(pendingMessage);
        } catch (error) {
          this.logger.error(
            `Failed to process pending message ${pendingMessage.id}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
            { error }
          );

          // Update the pending message status to failed
          await this.updateMessageStatus(
            pendingMessage.id,
            PendingMessageStatus.FAILED
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to process pending messages for group ${whatsappGroupId}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    }
  }

  /**
   * Process a single pending message
   * @param pendingMessage - The pending message to process
   * @returns Promise<void>
   */
  private async processPendingMessage(pendingMessage: {
    id: string;
    messageType: PendingMessageType;
    whatsappGroupId: string;
    groupName: string;
  }): Promise<void> {
    // Based on message type, send the appropriate message
    switch (pendingMessage.messageType) {
      case PendingMessageType.GROUP_ADDED_DISABLED:
        await this.groupMessagesService.sendGroupAddedDisabledMessage(
          pendingMessage.whatsappGroupId,
          pendingMessage.groupName
        );
        break;
      default:
        this.logger.warn(
          `Unknown pending message type: ${pendingMessage.messageType}`
        );
        return;
    }

    // Update the pending message as sent
    await this.updateMessageStatus(
      pendingMessage.id,
      PendingMessageStatus.SENT
    );

    this.logger.log(
      `Successfully processed pending message ${pendingMessage.id} for group ${pendingMessage.groupName}`
    );
  }

  /**
   * Update the status of a pending message
   * @param messageId - ID of the message to update
   * @param status - New status
   * @returns The updated message
   */
  private async updateMessageStatus(
    messageId: string,
    status: PendingMessageStatus
  ) {
    try {
      const data: any = {
        status,
      };

      // Add sentAt field if the message was sent successfully
      if (status === PendingMessageStatus.SENT) {
        data.sentAt = new Date();
      }

      // Increment retry count if the message failed
      if (status === PendingMessageStatus.FAILED) {
        data.retryCount = { increment: 1 };
      }

      return await this.prisma.pendingGroupMessage.update({
        where: { id: messageId },
        data,
      });
    } catch (error) {
      this.logger.error(
        `Failed to update message status: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
      throw error;
    }
  }
}
