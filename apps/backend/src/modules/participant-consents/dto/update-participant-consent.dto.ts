import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { ConsentResponseType } from '@prisma/client';

export class UpdateParticipantConsentDto {
  @ApiProperty({
    description: 'Consent status',
    enum: ConsentResponseType,
    example: ConsentResponseType.accepted,
  })
  @IsNotEmpty()
  @IsEnum(ConsentResponseType)
  readonly consentStatus!: ConsentResponseType;
}
