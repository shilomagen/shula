import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { SystemMessageCategory } from '../system-messages.types';

export class CreateSystemMessageDto {
  @ApiProperty({
    description: 'Unique key for the system message',
    example: 'GROUP.PERSON_ADDED',
  })
  @IsString()
  @IsNotEmpty()
  readonly key!: string;

  @ApiProperty({
    description: 'Content of the system message with optional placeholders',
    example: '{{personName}} was added to the group {{groupName}}',
  })
  @IsString()
  @IsNotEmpty()
  readonly content!: string;

  @ApiProperty({
    description: 'Category of the system message',
    enum: SystemMessageCategory,
    example: SystemMessageCategory.GROUP,
  })
  @IsEnum(SystemMessageCategory)
  @IsNotEmpty()
  readonly category!: SystemMessageCategory;

  @ApiProperty({
    description: 'Additional metadata for the system message',
    example: { placeholders: ['personName', 'groupName'] },
    required: false,
  })
  @IsObject()
  @IsOptional()
  readonly metadata?: Record<string, unknown>;
}
