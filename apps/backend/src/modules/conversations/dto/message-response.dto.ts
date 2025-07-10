import { ApiProperty } from '@nestjs/swagger';
import {
  MessageType,
  MessageStatus,
  MediaStatus,
} from '../../../common/enums/domain.enums';

export class MessagePhotoInfoDto {
  @ApiProperty({
    description: 'ID of the photo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  photoId!: string;

  @ApiProperty({
    description: 'Status of the photo',
    enum: MediaStatus,
    example: MediaStatus.ACTIVE,
  })
  status!: MediaStatus;

  @ApiProperty({
    description: 'When the photo expires',
    example: '2024-03-10T12:00:00Z',
  })
  expiresAt!: Date;
}

export class MessageResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the message',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: 'ID of the conversation this message belongs to',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  conversationId!: string;

  @ApiProperty({
    description: 'Type of message or event',
    enum: MessageType,
    example: MessageType.USER_MESSAGE,
  })
  type!: MessageType;

  @ApiProperty({
    description: 'Text content of the message (if applicable)',
    example: 'Hello, I would like to register my child',
    required: false,
  })
  content?: string;

  @ApiProperty({
    description: 'When the message was sent',
    example: '2023-01-01T12:00:00Z',
  })
  timestamp!: Date;

  @ApiProperty({
    description: 'Current status of the message',
    enum: MessageStatus,
    example: MessageStatus.DELIVERED,
  })
  status!: MessageStatus;

  @ApiProperty({
    description:
      'ID of the related person (for PERSON_CREATED or PERSON_CONNECTED)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  personId?: string;

  @ApiProperty({
    description: 'Photo ID attached to the message (for IMAGE_UPLOAD)',
    type: String,
    required: false,
  })
  photoId?: string;

  @ApiProperty({
    description: 'Additional metadata about the message',
    example: { processingResult: 'face_detected' },
    required: false,
  })
  metadata?: Record<string, unknown>;
}
