import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';

export class ParticipantsResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Participant phone number',
    example: '+1234567890',
  })
  phoneNumber!: string;

  @ApiProperty({
    description: 'Participant name',
    example: 'John Doe',
  })
  name!: string;

  @ApiProperty({
    description: 'Participant status',
    example: 'active',
  })
  status!: string;

  @ApiProperty({
    description: 'Date when participant joined',
    example: '2023-01-01T00:00:00.000Z',
  })
  joinedAt!: Date;
}
