import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum GroupStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export class GroupsUpdateStatusDto {
  @ApiProperty({
    description: 'Group status',
    enum: GroupStatus,
    example: GroupStatus.ACTIVE,
  })
  @IsNotEmpty()
  @IsEnum(GroupStatus)
  status!: GroupStatus;
}
