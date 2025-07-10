import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class RenderSystemMessageDto {
  @ApiProperty({
    description: 'Key of the system message to render',
    example: 'GROUP.PERSON_ADDED',
  })
  @IsString()
  @IsNotEmpty()
  readonly key: string = '';

  @ApiProperty({
    description: 'Parameters to replace placeholders in the message',
    example: { personName: 'John', groupName: 'Family Group' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  readonly params?: Record<string, string | number | boolean>;
}
