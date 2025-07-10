import { Injectable } from '@nestjs/common';
import { GroupEventType } from '@shula/shared-queues';
import { ContextLogger } from 'nestjs-context-logger';
import { GroupChat, GroupNotification } from 'whatsapp-web.js';
import { GroupEventsQueueService } from '../queues/group-events.queue';

/**
 * Service for handling WhatsApp group-related events
 */
@Injectable()
export class GroupHandlersService {
  private readonly logger = new ContextLogger(GroupHandlersService.name);

  constructor(
    private readonly groupEventsQueueService: GroupEventsQueueService
  ) {}

  /**
   * Handles the GROUP_JOIN event when participants are added to a group
   * @param notification - The notification message from WhatsApp
   */
  async handleGroupJoin(notification: GroupNotification): Promise<void> {
    this.logger.log('Participants were added to a group', {
      groupId: notification.chatId,
      addedBy: notification.author,
      notification,
    });

    try {
      // Get group info
      const groupChat = (await notification.getChat()) as GroupChat;
      const groupName = groupChat.name || 'Unknown Group';

      // Map all participants
      const participants = (groupChat.participants || []).map((p) => ({
        id: p.id._serialized,
        name: 'Unknown',
        isAdmin: p.isAdmin || false,
      }));

      // Pass the raw recipient IDs directly
      const addedUsers = notification.recipientIds || [];

      await this.groupEventsQueueService.publishGroupJoinedEvent({
        eventType: GroupEventType.GROUP_JOINED,
        groupId: notification.chatId,
        groupName,
        isReadOnly: groupChat.isReadOnly || false,
        initiatorId: notification.author,
        initiatorName: notification.author
          ? notification.author.split('@')[0]
          : 'Unknown',
        participants,
        addedUsers,
        timestamp: new Date(),
        metadata: {
          recipientIds: notification.recipientIds,
          messageId: notification.id,
        },
      });

      this.logger.log('Successfully queued group join event', {
        groupName,
        groupId: notification.chatId,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Failed to process group join event', {
          error: error.message,
          stack: error.stack,
        });
      } else {
        this.logger.error('Failed to process group join event', {
          error: 'Unknown error',
        });
      }
      throw error;
    }
  }

  /**
   * Handles the GROUP_LEAVE event when participants are removed from a group
   * @param notification - The notification message from WhatsApp
   */
  async handleGroupLeave(notification: GroupNotification): Promise<void> {
    this.logger.log('Participants were removed from a group', {
      groupId: notification.chatId,
      removedBy: notification.author,
      notification,
    });

    try {
      // Pass the raw recipient IDs directly
      const removedUsers = notification.recipientIds || [];

      await this.groupEventsQueueService.publishGroupLeftEvent({
        eventType: GroupEventType.GROUP_LEFT,
        groupId: notification.chatId,
        initiatorId: notification.author,
        initiatorName: notification.author
          ? notification.author.split('@')[0]
          : 'Unknown',
        removedUsers,
        timestamp: new Date(),
        metadata: {
          recipientIds: notification.recipientIds,
          messageId: notification.id,
        },
      });

      this.logger.log('Successfully queued group leave event', {
        groupId: notification.chatId,
        removedUsers,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Failed to process group leave event', {
          error: error.message,
          stack: error.stack,
        });
      } else {
        this.logger.error('Failed to process group leave event', {
          error: 'Unknown error',
        });
      }
      throw error;
    }
  }

  /**
   * Handles the GROUP_ADMIN_CHANGED event when admin status changes in a group
   * @param notification - The notification message from WhatsApp
   */
  async handleGroupAdminChanged(
    notification: GroupNotification
  ): Promise<void> {
    this.logger.log('Admin status changed in a group', {
      groupId: notification.chatId,
      initiatedBy: notification.author,
      notification,
    });

    try {
      // Get the participant ID whose admin status changed (from recipients)
      const participantId = notification.recipientIds?.[0] || '';

      // Try to determine if they are now an admin based on the notification
      let isNowAdmin = false;

      try {
        // Get group info to check current admin status
        const groupChat = (await notification.getChat()) as GroupChat;

        // Find the participant in the group
        const participant = groupChat.participants.find(
          (p) => p.id._serialized === participantId
        );

        // If we found the participant, check if they're an admin
        if (participant) {
          isNowAdmin = participant.isAdmin || false;
          this.logger.log('Participant admin status', {
            participantId,
            isAdmin: isNowAdmin,
          });
        }
      } catch (error) {
        this.logger.error('Error getting current admin status', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      await this.groupEventsQueueService.publishGroupAdminChangedEvent({
        eventType: GroupEventType.GROUP_ADMIN_CHANGED,
        groupId: notification.chatId,
        participantId,
        isNowAdmin,
        timestamp: new Date(),
        metadata: {
          recipientIds: notification.recipientIds,
          messageId: notification.id,
        },
      });

      this.logger.log('Successfully queued group admin change', {
        groupId: notification.chatId,
        participantId,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error('Failed to process group admin change event', {
          error: error.message,
          stack: error.stack,
        });
      } else {
        this.logger.error('Failed to process group admin change event', {
          error: 'Unknown error',
        });
      }
      throw error;
    }
  }
}
