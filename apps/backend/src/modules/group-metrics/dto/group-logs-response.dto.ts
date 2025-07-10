import { ApiProperty } from '@nestjs/swagger';
import { GroupEventType } from '../group-metrics.service';
import { MessageMediaType } from '@shula/shared-queues';

export class PaginationMetadata {
  @ApiProperty()
  readonly page!: number;

  @ApiProperty()
  readonly limit!: number;

  @ApiProperty()
  readonly total!: number;

  @ApiProperty()
  readonly totalPages!: number;
}

export class GroupEventLogItem {
  @ApiProperty()
  readonly id!: string;

  @ApiProperty()
  readonly groupId!: string;

  @ApiProperty({ enum: GroupEventType })
  readonly eventType!: GroupEventType;

  @ApiProperty({ enum: MessageMediaType, required: false })
  readonly mediaType?: MessageMediaType;

  @ApiProperty({ required: false })
  readonly metadata?: Record<string, unknown>;

  @ApiProperty()
  readonly timestamp!: Date;
}

export class GroupLogsResponseDto {
  @ApiProperty({ type: [GroupEventLogItem] })
  readonly items!: GroupEventLogItem[];

  @ApiProperty()
  readonly pagination!: PaginationMetadata;
}
