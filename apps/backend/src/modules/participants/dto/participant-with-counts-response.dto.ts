import { ApiProperty } from '@nestjs/swagger';
import { ParticipantsResponseDto } from './participants-response.dto';

export class ParticipantWithCountsResponseDto extends ParticipantsResponseDto {

  @ApiProperty({
    description: 'Number of persons connected to the participant',
    example: 2,
  })
  personsCount = 0;
}
