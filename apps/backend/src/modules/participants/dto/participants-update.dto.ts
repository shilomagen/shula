import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ParticipantsUpdateDto {
  @ApiProperty({
    description: 'Participant name',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;
}
