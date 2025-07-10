import { ApiProperty } from '@nestjs/swagger';

export class GroupStatsResponseDto {
  @ApiProperty({
    description: 'Total number of active groups',
    example: 25,
  })
  totalActive!: number;

  @ApiProperty({
    description: 'Total number of inactive groups',
    example: 5,
  })
  totalInactive!: number;

  @ApiProperty({
    description: 'Total number of groups',
    example: 30,
  })
  total!: number;
}
