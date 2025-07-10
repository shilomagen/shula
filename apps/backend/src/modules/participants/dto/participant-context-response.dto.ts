import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for a person in a group
 */
export class GroupPersonResponseDto {
  @ApiProperty({
    description: 'The person ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  readonly id!: string;

  @ApiProperty({
    description: 'The person name',
    example: 'John Doe',
  })
  readonly name!: string;
}

/**
 * DTO for a group with related persons
 */
export class EnhancedGroupResponseDto {
  @ApiProperty({
    description: 'The group ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  readonly id!: string;

  @ApiProperty({
    description: 'The group name',
    example: 'Family',
  })
  readonly name!: string;

  @ApiProperty({
    description: 'Persons related to this group',
    type: [GroupPersonResponseDto],
  })
  readonly persons!: GroupPersonResponseDto[];
}

/**
 * DTO for participant context response
 */
export class ParticipantContextResponseDto {
  @ApiProperty({
    description: 'The participant name',
    example: 'Jane Doe',
  })
  readonly name!: string;

  @ApiProperty({
    description: 'Groups the participant belongs to',
    type: [EnhancedGroupResponseDto],
  })
  readonly groups!: EnhancedGroupResponseDto[];
}
