import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ParticipantsCreateDto {
  @ApiProperty({
    description: 'Participant phone number in international format',
    example: '+1234567890',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'Phone number must be in international format (e.g., +1234567890)',
  })
  phoneNumber!: string;

  @ApiProperty({
    description: 'Participant name',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;
}
