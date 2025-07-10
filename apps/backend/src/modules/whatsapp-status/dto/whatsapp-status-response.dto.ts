import { ApiProperty } from '@nestjs/swagger';

export class WhatsAppStatusResponseDto {
  @ApiProperty({
    description: 'Whether the WhatsApp connection is healthy',
    example: true,
    type: Boolean,
  })
  readonly isHealthy!: boolean;

  @ApiProperty({
    description: 'Current state of the WhatsApp connection',
    example: 'CONNECTED',
    nullable: true,
    type: String,
  })
  readonly state!: string | null;

  @ApiProperty({
    description: 'Number of consecutive connection failures',
    example: 0,
    type: Number,
  })
  readonly failureCount!: number;

  @ApiProperty({
    description: 'Whether a QR code is available',
    example: false,
    type: Boolean,
  })
  readonly hasQrCode!: boolean;

  @ApiProperty({
    description: 'Timestamp of the last status update',
    example: '2023-06-01T12:00:00.000Z',
    type: Date,
  })
  readonly updatedAt!: Date;
}
