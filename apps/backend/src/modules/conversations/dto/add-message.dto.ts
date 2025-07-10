import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID
} from 'class-validator';
import { MessageType } from '../../../common/enums/domain.enums';

export class AddMessageDto {
  @ApiProperty({
    description: 'ID of the conversation to add the message to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID('4')
  conversationId!: string;

  @ApiProperty({
    description: 'Type of message or event',
    enum: MessageType,
    example: MessageType.USER_MESSAGE,
  })
  @IsNotEmpty()
  @IsEnum(MessageType)
  type!: MessageType;

  @ApiProperty({
    description: 'Text content of the message (if applicable)',
    example: 'Hello, I would like to register my child',
    required: false,
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({
    description:
      'ID of the related person (for PERSON_CREATED or PERSON_CONNECTED)',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  @IsOptional()
  @IsUUID('4')
  personId?: string;

  @ApiProperty({
    description: 'Related photo ID (for IMAGE_UPLOAD)',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString()
  photoId?: string;

  @ApiProperty({
    description: 'Additional metadata about the message',
    example: { processingResult: 'face_detected' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
