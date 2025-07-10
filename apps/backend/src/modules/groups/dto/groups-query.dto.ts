import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, Min, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class GroupsQueryDto {
  @ApiProperty({
    description: 'Page number (1-indexed)',
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  size?: number = 10;

  @ApiProperty({
    description: 'Minimum number of participants',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minParticipants?: number;

  @ApiProperty({
    description: 'Maximum number of participants',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxParticipants?: number;

  @ApiProperty({
    description: 'Filter groups by name (case-insensitive partial match)',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Filter groups by participant ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  participantId?: string;
}
