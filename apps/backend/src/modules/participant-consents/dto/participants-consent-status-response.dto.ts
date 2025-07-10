import { ApiProperty } from '@nestjs/swagger';
import { ParticipantConsentStatusResponseDto } from './participant-consent-status-response.dto';

export class ParticipantsConsentStatusResponseDto {
  @ApiProperty({
    description: 'List of participants with their consent status',
    type: [ParticipantConsentStatusResponseDto],
  })
  items!: ParticipantConsentStatusResponseDto[];
}
