import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class GroupsUpdateDto {
  @ApiPropertyOptional({
    description: 'Group name',
    example: 'School Parents Group',
  })
  @IsOptional()
  @IsString({ message: 'Group name must be a string' })
  @MinLength(1, { message: 'Group name cannot be empty' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Group description',
    example: 'A group for parents of students in Class 5A',
  })
  @IsOptional()
  @IsString({ message: 'Group description must be a string' })
  description?: string;
}
