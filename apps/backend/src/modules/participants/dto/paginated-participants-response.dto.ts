import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseBaseDto } from '../../../common/dtos/paginated-response.dto';
import { ParticipantsResponseDto } from './participants-response.dto';

export class PaginatedParticipantsResponseDto extends PaginatedResponseBaseDto {
  @ApiProperty({
    description: 'Array of participants',
    type: [ParticipantsResponseDto],
  })
  items!: ParticipantsResponseDto[];
}
