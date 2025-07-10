'use server';

import {
  CreateSystemMessageDto,
  SystemMessageResponseDto,
  UpdateSystemMessageDto,
} from '@/generated/http-clients/backend';
import { systemMessagesApi } from '@/lib/api-client';

/**
 * Get all system messages
 */
export async function getAllSystemMessages(): Promise<
  SystemMessageResponseDto[]
> {
  const response = await systemMessagesApi.getAllSystemMessages();
  return response.data;
}

/**
 * Get a system message by ID
 */
export async function getSystemMessageById(
  id: string
): Promise<SystemMessageResponseDto> {
  const response = await systemMessagesApi.getSystemMessageById(id);
  return response.data;
}

/**
 * Create a new system message
 */
export async function createSystemMessage(
  data: CreateSystemMessageDto
): Promise<SystemMessageResponseDto> {
  const response = await systemMessagesApi.createSystemMessage(data);
  return response.data;
}

/**
 * Update a system message
 */
export async function updateSystemMessage(
  id: string,
  data: UpdateSystemMessageDto
): Promise<SystemMessageResponseDto> {
  const response = await systemMessagesApi.updateSystemMessage(id, data);
  return response.data;
}

/**
 * Delete a system message
 */
export async function deleteSystemMessage(id: string): Promise<void> {
  const response = await systemMessagesApi.deleteSystemMessage(id);
  return response.data;
}
