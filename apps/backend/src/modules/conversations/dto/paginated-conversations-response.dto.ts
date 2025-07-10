import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseBaseDto } from '../../../common/dtos/paginated-response.dto';
import { ConversationResponseDto } from './conversation-response.dto';

export class PaginatedConversationsResponseDto extends PaginatedResponseBaseDto {
  @ApiProperty({
    description: 'Array of conversations',
    type: [ConversationResponseDto],
  })
  items!: ConversationResponseDto[];
}
