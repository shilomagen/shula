import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for querying participants with filters
 */
export class ParticipantsQueryDto {
  @ApiProperty({
    description: 'Page number (1-indexed)',
    required: false,
    default: 1,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    default: 10,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  size?: number = 10;

  @ApiProperty({
    description: 'Filter participants by name (case-insensitive partial match)',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Filter participants by phone number (partial match)',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Filter participants by status (active/inactive)',
    required: false,
    type: String,
    enum: ['active', 'inactive'],
  })
  @IsOptional()
  @IsString()
  status?: 'active' | 'inactive';
}
