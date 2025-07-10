import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseBaseDto } from '../../../common/dtos/paginated-response.dto';
import { GroupsResponseDto } from './groups-response.dto';

export class PaginatedGroupsResponseDto extends PaginatedResponseBaseDto {
  @ApiProperty({
    description: 'Array of groups',
    type: [GroupsResponseDto],
  })
  items!: GroupsResponseDto[];
}
