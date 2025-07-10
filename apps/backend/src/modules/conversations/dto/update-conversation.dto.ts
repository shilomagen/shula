import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ConversationStatus } from '../../../common/enums/domain.enums';

export class UpdateConversationDto {
  @ApiProperty({
    description: 'The current node ID in the conversation graph',
    required: false,
  })
  @IsString()
  @IsOptional()
  currentNode?: string;

  @ApiProperty({
    description: 'Additional metadata for the conversation',
    required: false,
    type: Object,
  })
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: 'The status of the conversation',
    required: false,
    enum: ConversationStatus,
  })
  @IsEnum(ConversationStatus)
  @IsOptional()
  status?: ConversationStatus;
}
