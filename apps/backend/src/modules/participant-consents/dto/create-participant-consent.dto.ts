import { ApiProperty } from '@nestjs/swagger';
import { ConsentResponseType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateParticipantConsentDto {
  @ApiProperty({
    description: 'Group ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID()
  readonly groupId!: string;

  @ApiProperty({
    description: 'Participant ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    format: 'uuid',
  })
  @IsNotEmpty()
  @IsUUID()
  readonly participantId!: string;

  @ApiProperty({
    description: 'Consent status',
    enum: ConsentResponseType,
    example: ConsentResponseType.pending,
    default: ConsentResponseType.pending,
  })
  @IsEnum(ConsentResponseType)
  readonly consentStatus: ConsentResponseType = ConsentResponseType.pending;
}
