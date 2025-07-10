import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseBaseDto } from '../../../common/dtos/paginated-response.dto';
import { GroupWithCountsResponseDto } from './group-with-counts-response.dto';

export class PaginatedGroupsWithCountsResponseDto extends PaginatedResponseBaseDto {
  @ApiProperty({
    description: 'Array of groups with counts',
    type: [GroupWithCountsResponseDto],
  })
  items!: GroupWithCountsResponseDto[];
}
