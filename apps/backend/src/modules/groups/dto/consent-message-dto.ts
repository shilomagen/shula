import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for updating a group's consent message ID
 */
export class ConsentMessageDto {
  @ApiProperty({
    description: 'The WhatsApp group ID',
    example: '123456789',
  })
  @IsNotEmpty()
  @IsString()
  readonly whatsappGroupId: string = '';

  @ApiProperty({
    description: 'The serialized message ID of the consent message',
    example: 'true_123456789@g.us_ABCDEFG123456789',
  })
  @IsNotEmpty()
  @IsString()
  readonly consentMessageId: string = '';
}
