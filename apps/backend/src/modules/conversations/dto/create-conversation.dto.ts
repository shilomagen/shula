import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ConversationType } from '../../../common/enums/domain.enums';

export class CreateConversationDto {
  @ApiProperty({
    description: 'ID of the participant to start a conversation with',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  participantId!: string;

  @ApiProperty({
    description: 'Type of conversation to start',
    enum: ConversationType,
    example: ConversationType.ONBOARDING,
  })
  @IsNotEmpty()
  @IsEnum(ConversationType)
  conversationType!: ConversationType;

  @ApiProperty({
    description: 'Current node identifier in the conversation flow',
    example: 'welcome_node',
    required: false,
  })
  @IsOptional()
  @IsNotEmpty()
  currentNode?: string;

  @ApiProperty({
    description: 'Initial metadata for the conversation',
    example: { initialStep: 'welcome' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
