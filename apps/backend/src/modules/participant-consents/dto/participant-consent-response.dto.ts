import { ApiProperty } from '@nestjs/swagger';
import { ConsentResponseType } from '@prisma/client';

export class ParticipantConsentResponseDto {
  @ApiProperty({
    description: 'Consent record ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
  })
  readonly id!: string;

  @ApiProperty({
    description: 'Group ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: String,
  })
  readonly groupId!: string;

  @ApiProperty({
    description: 'Participant ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
    type: String,
  })
  readonly participantId!: string;

  @ApiProperty({
    description: 'Consent status',
    enum: ConsentResponseType,
    example: ConsentResponseType.accepted,
    type: String,
  })
  readonly consentStatus!: ConsentResponseType;

  @ApiProperty({
    description: 'Date when the participant responded',
    example: '2023-01-01T12:00:00Z',
    required: false,
    nullable: true,
    type: Date,
  })
  readonly respondedAt!: Date | null;

  @ApiProperty({
    description: 'Participant name',
    example: 'John Doe',
    required: false,
    type: String,
  })
  readonly participantName?: string;

  @ApiProperty({
    description: 'Participant phone number',
    example: '+972501234567',
    required: false,
    type: String,
  })
  readonly participantPhoneNumber?: string;
}
