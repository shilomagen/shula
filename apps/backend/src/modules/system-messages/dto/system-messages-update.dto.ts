import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { SystemMessageCategory } from '../system-messages.types';

export class UpdateSystemMessageDto {
  @ApiProperty({
    description: 'Content of the system message with optional placeholders',
    example: '{{personName}} was added to the group {{groupName}}',
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly content?: string;

  @ApiProperty({
    description: 'Category of the system message',
    enum: SystemMessageCategory,
    example: SystemMessageCategory.GROUP,
    required: false,
  })
  @IsEnum(SystemMessageCategory)
  @IsOptional()
  readonly category?: SystemMessageCategory;

  @ApiProperty({
    description: 'Additional metadata for the system message',
    example: { placeholders: ['personName', 'groupName'] },
    required: false,
  })
  @IsObject()
  @IsOptional()
  readonly metadata?: Record<string, unknown>;
}
