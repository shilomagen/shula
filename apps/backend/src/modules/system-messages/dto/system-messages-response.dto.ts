import { ApiProperty } from '@nestjs/swagger';
import { SystemMessageCategory } from '../system-messages.types';

export class SystemMessageResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the system message',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  readonly id!: string;

  @ApiProperty({
    description: 'Unique key for the system message',
    example: 'GROUP.PERSON_ADDED',
  })
  readonly key!: string;

  @ApiProperty({
    description: 'Content of the system message with optional placeholders',
    example: '{{personName}} was added to the group {{groupName}}',
  })
  readonly content!: string;

  @ApiProperty({
    description: 'Category of the system message',
    enum: SystemMessageCategory,
    example: SystemMessageCategory.GROUP,
  })
  readonly category!: SystemMessageCategory;

  @ApiProperty({
    description: 'Additional metadata for the system message',
    example: { placeholders: ['personName', 'groupName'] },
  })
  readonly metadata?: Record<string, unknown>;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  readonly createdAt!: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  readonly updatedAt!: Date;
}
