import { ApiProperty } from '@nestjs/swagger';
import { MessageMediaType } from '@shula/shared-queues';

export class MediaCounts {
  @ApiProperty({ enum: MessageMediaType })
  readonly [MessageMediaType.IMAGE]!: number;

  @ApiProperty({ enum: MessageMediaType })
  readonly [MessageMediaType.VIDEO]!: number;

  @ApiProperty({ enum: MessageMediaType })
  readonly [MessageMediaType.DOCUMENT]!: number;

  @ApiProperty({ enum: MessageMediaType })
  readonly [MessageMediaType.AUDIO]!: number;

  @ApiProperty({ enum: MessageMediaType })
  readonly [MessageMediaType.STICKER]!: number;

  @ApiProperty({ enum: MessageMediaType })
  readonly [MessageMediaType.LOCATION]!: number;

  @ApiProperty({ enum: MessageMediaType })
  readonly [MessageMediaType.CONTACT]!: number;

  @ApiProperty()
  readonly total!: number;
}

export class GroupMetricsResponseDto {
  @ApiProperty()
  readonly groupId!: string;

  @ApiProperty()
  readonly period!: {
    startDate: string;
    endDate: string;
  };

  @ApiProperty()
  readonly messagesProcessed!: number;

  @ApiProperty()
  readonly mediaProcessed!: MediaCounts;
}

export class GroupMessagesCountResponseDto {
  @ApiProperty()
  readonly groupId!: string;

  @ApiProperty()
  readonly messagesCount!: number;

  @ApiProperty()
  readonly period!: {
    startDate: string;
    endDate: string;
  };
}

export class GroupMediaCountResponseDto {
  @ApiProperty()
  readonly groupId!: string;

  @ApiProperty({ enum: MessageMediaType, required: false })
  readonly mediaType?: MessageMediaType;

  @ApiProperty({ required: false })
  readonly count?: number;

  @ApiProperty({ required: false, type: MediaCounts })
  readonly mediaCounts?: MediaCounts;

  @ApiProperty()
  readonly period!: {
    startDate: string;
    endDate: string;
  };
}
