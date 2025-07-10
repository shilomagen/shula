import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class GroupsCreateDto {
  @ApiProperty({
    description: 'WhatsApp group ID',
    example: '123456789@g.us',
  })
  @IsNotEmpty({ message: 'WhatsApp group ID is required' })
  @IsString({ message: 'WhatsApp group ID must be a string' })
  @Matches(/^[0-9]+@g\.us$/, {
    message:
      'WhatsApp group ID must be in the format of numbers followed by @g.us',
  })
  whatsappGroupId!: string;

  @ApiProperty({
    description: 'Group name',
    example: 'School Parents Group',
  })
  @IsNotEmpty({ message: 'Group name is required' })
  @IsString({ message: 'Group name must be a string' })
  @MinLength(1, { message: 'Group name cannot be empty' })
  name!: string;

  @ApiPropertyOptional({
    description: 'Group description',
    example: 'A group for parents of students in Class 5A',
  })
  @IsOptional()
  @IsString({ message: 'Group description must be a string' })
  description?: string;
}
