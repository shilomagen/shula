import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseBaseDto } from '../../../common/dtos/paginated-response.dto';
import { ParticipantWithCountsResponseDto } from './participant-with-counts-response.dto';

export class PaginatedParticipantsWithCountsResponseDto extends PaginatedResponseBaseDto {
  @ApiProperty({
    description: 'Array of participants with counts',
    type: [ParticipantWithCountsResponseDto],
  })
  items!: ParticipantWithCountsResponseDto[];
}
