import { ApiProperty } from '@nestjs/swagger';
import { EntityStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class PersonsCreateDto {
  @ApiProperty({
    description: 'The name of the person',
    example: 'John Doe Jr.',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'The participant ID of the creator',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  @IsNotEmpty()
  participantId!: string;

  @ApiProperty({
    description: 'The group ID for context',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsUUID()
  @IsNotEmpty()
  groupId!: string;

  @ApiProperty({
    description: 'The status of the person',
    example: EntityStatus.active,
    enum: EntityStatus,
    required: false,
    default: EntityStatus.active,
  })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus;
}
