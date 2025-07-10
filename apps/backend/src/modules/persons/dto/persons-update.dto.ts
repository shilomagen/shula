import { ApiProperty } from '@nestjs/swagger';
import { EntityStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class PersonsUpdateDto {
  @ApiProperty({
    description: 'The name of the person',
    example: 'John Doe Jr.',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

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
