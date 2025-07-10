'use server';

import { conversationsApi } from '../api-client';
import { UpdateConversationDto } from '@/generated/http-clients/backend/models';

/**
 * Get a conversation by ID
 * @param id Conversation ID
 * @returns Conversation data
 */
export async function getConversationById(id: string) {
  try {
    const response = await conversationsApi.getConversationById(id);
    return response.data;
  } catch (error) {
    console.error(`Error fetching conversation ${id}:`, error);
    throw error;
  }
}

/**
 * Get messages for a specific conversation
 * @param id Conversation ID
 * @returns Array of messages in the conversation
 */
export async function getConversationMessages(id: string) {
  try {
    const response = await conversationsApi.getConversationMessages(id);
    return response.data;
  } catch (error) {
    console.error(`Error fetching messages for conversation ${id}:`, error);
    throw error;
  }
}

/**
 * Retrieve all conversations for a specific participant
 * @param participantId ID of the participant
 * @returns Array of conversations
 */
export async function getConversationsByParticipantId(participantId: string) {
  try {
    const response = await conversationsApi.getConversationsByParticipantId(
      participantId
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching conversations for participant ${participantId}:`,
      error
    );
    throw error;
  }
}

/**
 * Mark a conversation as abandoned
 * @param id Conversation ID
 * @returns Updated conversation data
 */
export async function abandonConversation(id: string) {
  try {
    const response = await conversationsApi.abandonConversation(id);
    return response.data;
  } catch (error) {
    console.error(`Error abandoning conversation ${id}:`, error);
    throw error;
  }
}

/**
 * Send a message to a conversation
 * @param id Conversation ID
 * @param content Message content
 * @returns The sent message data
 */
export async function sendMessage(id: string, content: string) {
  try {
    const response = await conversationsApi.sendMessage(id, {
      content,
    });
    return response.data;
  } catch (error) {
    console.error(`Error sending message to conversation ${id}:`, error);
    throw error;
  }
}

/**
 * Update a conversation with new data
 * @param id Conversation ID
 * @param data Data to update (currentNode, metadata, or status)
 * @returns Updated conversation data
 */
export async function updateConversation(
  id: string,
  data: UpdateConversationDto
) {
  try {
    const response = await conversationsApi.updateConversation(id, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating conversation ${id}:`, error);
    throw error;
  }
}

/**
 * Get all conversations with filtering and pagination
 * @param page Page number (1-based index)
 * @param size Number of items per page
 * @param participantName Optional filter by participant name
 * @param participantPhone Optional filter by participant phone number
 * @returns Paginated list of conversations
 */
export async function getAllConversations(
  page: number = 1,
  size: number = 10,
  participantName?: string,
  participantPhone?: string
) {
  try {
    const response = await conversationsApi.getAllConversations(
      page,
      size,
      participantName,
      participantPhone
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}
