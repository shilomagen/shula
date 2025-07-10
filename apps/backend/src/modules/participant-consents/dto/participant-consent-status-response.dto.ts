import { ApiProperty } from '@nestjs/swagger';
import { ConsentResponseType } from '@prisma/client';

export class ParticipantConsentStatusResponseDto {
  @ApiProperty({
    description: 'Participant ID',
    format: 'uuid',
  })
  participantId!: string;

  @ApiProperty({
    description: 'Group ID',
    format: 'uuid',
  })
  groupId!: string;

  @ApiProperty({
    description: 'Consent status',
    enum: ConsentResponseType,
  })
  status!: ConsentResponseType;

  @ApiProperty({
    description: 'Last update timestamp',
    type: Date,
  })
  updatedAt!: Date;
}
