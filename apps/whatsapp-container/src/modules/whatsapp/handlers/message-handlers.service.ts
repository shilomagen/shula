import { Injectable } from '@nestjs/common';
import {
  AudioMessageMedia,
  ContactMessageMedia,
  DocumentMessageMedia,
  GroupEventType,
  ImageMessageMedia,
  LocationMessageMedia,
  MessageEventType,
  MessageMedia,
  MessageMediaType,
  MessageStatus,
  StickerMessageMedia,
  VideoMessageMedia,
} from '@shula/shared-queues';
import { ContextLogger } from 'nestjs-context-logger';
import {
  GroupChat,
  Message,
  MessageTypes,
  MessageMedia as WhatsAppMessageMedia,
} from 'whatsapp-web.js';
import { GroupEventsQueueService } from '../queues/group-events.queue';
import { MessageEventsQueueService } from '../queues/message-events.queue';
import { GroupSyncThrottlerService } from '../services/group-sync-throttler.service';

interface MessageCache {
  timestamp: number;
  processed: boolean;
}

/**
 * Service for handling WhatsApp message-related events
 */
@Injectable()
export class MessageHandlersService {
  private readonly logger = new ContextLogger(MessageHandlersService.name);
  // Cache to store recently processed messages and prevent duplicates
  private readonly messageCache = new Map<string, MessageCache>();
  // Time window in milliseconds to consider duplicate messages (e.g., 2 seconds)
  private readonly deduplicationWindowMs = 2000;
  // How often to clean up the cache (in milliseconds)
  private readonly cacheCleanupIntervalMs = 60000; // 1 minute

  private supportedMessageTypes = [
    MessageTypes.TEXT,
    MessageTypes.IMAGE,
    MessageTypes.VIDEO,
    MessageTypes.AUDIO,
    MessageTypes.DOCUMENT,
  ];

  constructor(
    private readonly messageEventsQueueService: MessageEventsQueueService,
    private readonly groupEventsQueueService: GroupEventsQueueService,
    private readonly groupSyncThrottlerService: GroupSyncThrottlerService
  ) {
    // Start the cache cleanup interval
    setInterval(() => this.cleanupMessageCache(), this.cacheCleanupIntervalMs);
  }

  /**
   * Handles the MESSAGE_RECEIVED event when a message is received
   * @param message - The message from WhatsApp
   */
  async handleMessageReceived(message: Message): Promise<void> {
    try {
      const messageId = message.id._serialized;
      this.logger.log(`Message received: ${messageId}`);

      // Skip messages sent by the bot itself
      if (message.fromMe) {
        this.logger.debug('Skipping message sent by the bot itself');
        return;
      }

      if (!this.supportedMessageTypes.includes(message.type)) {
        this.logger.warn(
          `Unsupported message type: ${message.type} - skipping processing`
        );
        return;
      }

      // Check for duplicate messages
      if (this.isDuplicateMessage(messageId)) {
        this.logger.warn(
          `Duplicate message detected: ${messageId} - skipping processing`
        );
        return;
      }

      // Mark message as being processed
      this.markMessageAsProcessing(messageId);

      // Get chat and contact info
      const chat = await message.getChat();
      const contact = await message.getContact();

      if (chat.isGroup) {
        const groupChat = chat as GroupChat;
        this.logger.log(
          `Participants: ${JSON.stringify(groupChat.participants)}`
        );

        // Sync group participants with throttling
        await this.syncGroupParticipantsWithThrottling(groupChat);
      }

      // Log whether this is a group chat or private chat
      this.logChatType(chat, contact);

      // Extract phone number from ID (format: countrycode@c.us)
      const phoneNumber = contact.id.user;

      // Get media if available
      const media = await this.getMessageMedia(message);

      // Publish message received event
      await this.publishMessageReceivedEvent(
        message,
        chat,
        contact,
        phoneNumber,
        media
      );

      // Mark the message as successfully processed
      this.markMessageAsProcessed(messageId);

      this.logger.log(`Successfully processed message: ${messageId}`);
    } catch (error) {
      // Mark message processing as failed
      if (message?.id?._serialized) {
        this.messageCache.delete(message.id._serialized);
      }
      this.handleError('process message', error);
    }
  }

  /**
   * Check if a message is a duplicate (already processed or being processed)
   * @param messageId - The message ID
   * @returns True if duplicate, false otherwise
   */
  private isDuplicateMessage(messageId: string): boolean {
    return this.messageCache.has(messageId);
  }

  /**
   * Mark a message as being processed
   * @param messageId - The message ID
   */
  private markMessageAsProcessing(messageId: string): void {
    this.messageCache.set(messageId, {
      timestamp: Date.now(),
      processed: false,
    });
  }

  /**
   * Mark a message as successfully processed
   * @param messageId - The message ID
   */
  private markMessageAsProcessed(messageId: string): void {
    const cacheEntry = this.messageCache.get(messageId);
    if (cacheEntry) {
      cacheEntry.processed = true;
    }
  }

  /**
   * Clean up old entries from the message cache
   */
  private cleanupMessageCache(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [messageId, cacheEntry] of this.messageCache.entries()) {
      if (now - cacheEntry.timestamp > this.deduplicationWindowMs) {
        this.messageCache.delete(messageId);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.debug(
        `Cleaned up ${expiredCount} expired message cache entries`
      );
    }
  }

  /**
   * Log the type of chat (group or private)
   * @param chat - The chat object
   * @param contact - The contact object
   */
  private logChatType(chat: any, contact: any): void {
    if (chat.isGroup) {
      this.logger.log(`Message is from group chat: ${chat.name}`);
    } else {
      this.logger.log(
        `Message is from private chat with: ${
          contact.name || contact.pushname || contact.id.user
        }`
      );
    }
  }

  /**
   * Get media from a message if available
   * @param message - The WhatsApp message
   * @returns The mapped media or undefined
   */
  private async getMessageMedia(
    message: Message
  ): Promise<MessageMedia | undefined> {
    if (!message.hasMedia) {
      return undefined;
    }

    const messageMedia = await message.downloadMedia();
    return this.mapMessageMedia(messageMedia, message.type);
  }

  /**
   * Publish a message received event
   * @param message - The WhatsApp message
   * @param chat - The chat object
   * @param contact - The contact object
   * @param phoneNumber - The phone number
   * @param media - The mapped media
   */
  private async publishMessageReceivedEvent(
    message: Message,
    chat: any,
    contact: any,
    phoneNumber: string,
    media: MessageMedia | undefined
  ): Promise<void> {
    await this.messageEventsQueueService.publishMessageReceivedEvent({
      eventType: MessageEventType.MESSAGE_RECEIVED,
      messageId: message.id._serialized,
      chatId: chat.id._serialized,
      isGroupChat: chat.isGroup,
      participantId: contact.id._serialized,
      participantName: contact.name || contact.pushname || 'Unknown',
      phoneNumber,
      content: message.body,
      media,
      timestamp: new Date(message.timestamp * 1000), // Convert Unix timestamp to Date
      metadata: {
        messageType: message.type,
        hasQuotedMsg: message.hasQuotedMsg,
        location: message.location,
        vCards: message.vCards,
        mentionedIds: message.mentionedIds,
      },
    });
  }

  /**
   * Handles the MESSAGE_ACK event when a message status changes
   * @param message - The message from WhatsApp
   * @param ack - The acknowledgment status
   */
  async handleMessageAck(message: Message, ack: number): Promise<void> {
    try {
      this.logger.log(
        `Message status changed: ${message.id._serialized}, ack: ${ack}`
      );

      // Skip messages received by the bot (only track outgoing messages)
      if (!message.fromMe) {
        this.logger.debug('Skipping ack for message not sent by the bot');
        return;
      }

      // Get chat and contact info
      const chat = await message.getChat();
      const contact = await message.getContact();

      // Map WhatsApp ack values to our status enum
      const status = this.mapAckToStatus(ack);

      // Publish message status changed event
      await this.publishMessageStatusChangedEvent(
        message,
        chat,
        contact,
        status,
        ack
      );

      this.logger.log(
        `Successfully processed message ack: ${message.id._serialized}`
      );
    } catch (error) {
      this.handleError('process message ack', error);
    }
  }

  /**
   * Map WhatsApp ack value to message status
   * @param ack - The acknowledgment value
   * @returns The mapped message status
   */
  private mapAckToStatus(ack: number): MessageStatus {
    // Map WhatsApp ack values to our status enum
    // 0: Message sent to server
    // 1: Message received by server
    // 2: Message received by device
    // 3: Message read by recipient
    // 4: Message played (for voice messages)
    switch (ack) {
      case 1:
      case 2:
        return MessageStatus.DELIVERED;
      case 3:
      case 4:
        return MessageStatus.READ;
      default:
        return MessageStatus.SENT;
    }
  }

  /**
   * Publish a message status changed event
   * @param message - The WhatsApp message
   * @param chat - The chat object
   * @param contact - The contact object
   * @param status - The message status
   * @param ack - The original ack value
   */
  private async publishMessageStatusChangedEvent(
    message: Message,
    chat: any,
    contact: any,
    status: MessageStatus,
    ack: number
  ): Promise<void> {
    await this.messageEventsQueueService.publishMessageStatusChangedEvent({
      eventType: MessageEventType.MESSAGE_STATUS_CHANGED,
      messageId: message.id._serialized,
      chatId: chat.id._serialized,
      participantId: contact.id._serialized,
      status,
      timestamp: new Date(),
      metadata: {
        ackValue: ack,
      },
    });
  }

  /**
   * Handle errors in a consistent way
   * @param action - The action that was being performed
   * @param error - The error that occurred
   */
  private handleError(action: string, error: unknown): void {
    if (error instanceof Error) {
      this.logger.error(`Failed to ${action}: ${error.message}`, { error });
    } else {
      this.logger.error(`Failed to ${action}: Unknown error`);
    }
  }

  /**
   * Map WhatsApp message media to our media type
   * @param media - The WhatsApp message media
   * @param messageType - The WhatsApp message type
   * @returns The mapped message media
   */
  private mapMessageMedia(
    media: WhatsAppMessageMedia,
    messageType: MessageTypes
  ): MessageMedia | undefined {
    if (!media) {
      return undefined;
    }

    // Map WhatsApp message type to our media type
    const mediaType = this.getMediaTypeFromMessageType(messageType);
    if (!mediaType) {
      return undefined;
    }

    // Create base media properties
    const baseMedia = {
      mimetype: media.mimetype || undefined,
      filename: media.filename || undefined,
    };

    // Create specific media type based on the message type
    switch (mediaType) {
      case MessageMediaType.IMAGE:
        return {
          ...baseMedia,
          mediaType,
          base64Data: media.data || undefined,
        } as ImageMessageMedia;

      case MessageMediaType.VIDEO:
        return {
          ...baseMedia,
          mediaType,
          mediaUrl: media.data || undefined,
        } as VideoMessageMedia;

      case MessageMediaType.AUDIO:
        return {
          ...baseMedia,
          mediaType,
          mediaUrl: media.data || undefined,
        } as AudioMessageMedia;

      case MessageMediaType.DOCUMENT:
        return {
          ...baseMedia,
          mediaType,
          mediaUrl: media.data || undefined,
        } as DocumentMessageMedia;

      case MessageMediaType.STICKER:
        return {
          ...baseMedia,
          mediaType,
          mediaUrl: media.data || undefined,
        } as StickerMessageMedia;

      case MessageMediaType.LOCATION:
        return {
          ...baseMedia,
          mediaType,
        } as LocationMessageMedia;

      case MessageMediaType.CONTACT:
        return {
          ...baseMedia,
          mediaType,
        } as ContactMessageMedia;

      default:
        return undefined;
    }
  }

  /**
   * Get media type from WhatsApp message type
   * @param messageType - The WhatsApp message type
   * @returns The mapped media type or undefined
   */
  private getMediaTypeFromMessageType(
    messageType: MessageTypes
  ): MessageMediaType | undefined {
    switch (messageType) {
      case MessageTypes.IMAGE:
        return MessageMediaType.IMAGE;
      case MessageTypes.VIDEO:
        return MessageMediaType.VIDEO;
      case MessageTypes.AUDIO:
      case MessageTypes.VOICE:
        return MessageMediaType.AUDIO;
      case MessageTypes.DOCUMENT:
        return MessageMediaType.DOCUMENT;
      case MessageTypes.STICKER:
        return MessageMediaType.STICKER;
      case MessageTypes.LOCATION:
        return MessageMediaType.LOCATION;
      case MessageTypes.CONTACT_CARD:
      case MessageTypes.CONTACT_CARD_MULTI:
        return MessageMediaType.CONTACT;
      default:
        return undefined;
    }
  }

  /**
   * Sync group participants with throttling to prevent frequent syncs
   * @param groupChat - The group chat object
   */
  private async syncGroupParticipantsWithThrottling(
    groupChat: GroupChat
  ): Promise<void> {
    try {
      const groupId = groupChat.id._serialized;

      // Check if we should sync (using atomic setNX operation)
      const shouldSync = await this.groupSyncThrottlerService.shouldSyncGroup(
        groupId
      );

      if (!shouldSync) {
        this.logger.debug(
          `Skipping group participants sync for ${groupId} - recently synced`
        );
        return;
      }

      this.logger.log(`Proceeding with group participants sync for ${groupId}`);

      // Map participants to our format
      const participants = (groupChat.participants || []).map((p) => ({
        id: p.id._serialized,
        name: 'Unknown',
        isAdmin: p.isAdmin || false,
      }));

      this.logger.log(
        `Syncing ${participants.length} participants in group ${groupId}`
      );

      // Publish the sync event
      await this.groupEventsQueueService.publishGroupParticipantsSyncEvent({
        eventType: GroupEventType.GROUP_PARTICIPANTS_SYNC,
        groupId,
        groupName: groupChat.name || 'Unknown Group',
        participants,
        timestamp: new Date(),
        metadata: {
          participantCount: participants.length,
        },
      });

      this.logger.debug('Successfully published group participants sync event');
    } catch (error) {
      this.logger.error(
        `Failed to sync group participants: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        { error }
      );
    }
  }
}
