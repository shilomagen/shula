import { ApiProperty } from '@nestjs/swagger';
import { GroupsResponseDto } from './groups-response.dto';

export class GroupWithCountsResponseDto extends GroupsResponseDto {
  @ApiProperty({
    description: 'Number of participants in the group',
    example: 25,
  })
  participantsCount!: number;

  @ApiProperty({
    description: 'Number of persons in the group',
    example: 20,
  })
  personsCount!: number;
}
