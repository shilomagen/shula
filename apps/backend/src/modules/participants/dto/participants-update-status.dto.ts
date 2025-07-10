import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { EntityStatus } from '../../../common/enums/domain.enums';

export class ParticipantsUpdateStatusDto {
  @ApiProperty({
    description: 'Participant status',
    example: EntityStatus.ACTIVE,
    enum: EntityStatus,
  })
  @IsNotEmpty()
  @IsEnum(EntityStatus)
  status!: EntityStatus;
}
