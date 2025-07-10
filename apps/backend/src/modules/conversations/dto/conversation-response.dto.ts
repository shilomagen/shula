import { ApiProperty } from '@nestjs/swagger';
import {
  ConversationStatus,
  ConversationType,
} from '../../../common/enums/domain.enums';

export class ConversationResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'ID of the participant in the conversation',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  participantId!: string;

  @ApiProperty({
    description: 'Current status of the conversation',
    enum: ConversationStatus,
    example: ConversationStatus.ACTIVE,
  })
  status!: ConversationStatus;

  @ApiProperty({
    description: 'Type of the conversation',
    enum: ConversationType,
    example: ConversationType.ONBOARDING,
  })
  conversationType!: ConversationType;

  @ApiProperty({
    description: 'When the conversation started',
    example: '2023-01-01T12:00:00Z',
  })
  startedAt!: Date;

  @ApiProperty({
    description: 'When the last message was sent or received',
    example: '2023-01-01T12:05:00Z',
  })
  lastMessageAt!: Date;

  @ApiProperty({
    description: 'Current node identifier in the conversation flow',
    example: 'welcome_node',
    required: false,
  })
  currentNode?: string;

  @ApiProperty({
    description: 'Additional metadata about the conversation state',
    example: { currentStep: 'collectName', collectedData: { name: 'John' } },
    required: false,
  })
  metadata?: Record<string, unknown>;
}
