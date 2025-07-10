import { ApiProperty } from '@nestjs/swagger';

// Base paginated response class without the generic type
export class PaginatedResponseBaseDto {
  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total!: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  size!: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  pages!: number;
}

// Generic interface that extends the base class
export class PaginatedResponseDto<T> extends PaginatedResponseBaseDto {
  items!: T[];
}
