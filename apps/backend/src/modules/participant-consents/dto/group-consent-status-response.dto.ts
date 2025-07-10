import { ApiProperty } from '@nestjs/swagger';

export class GroupConsentStatusResponseDto {
  @ApiProperty({
    description: 'Group ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  readonly groupId!: string;

  @ApiProperty({
    description:
      'Whether the group has enough consents to be considered approved',
    example: true,
    nullable: true,
  })
  readonly isApproved!: boolean | null;

  @ApiProperty({
    description: 'Group consent status as a string',
    example: 'approved',
    enum: ['approved', 'rejected', 'pending'],
  })
  readonly status!: 'approved' | 'rejected' | 'pending';
}
