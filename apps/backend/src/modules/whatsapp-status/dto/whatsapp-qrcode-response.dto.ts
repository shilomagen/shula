import { ApiProperty } from '@nestjs/swagger';

export class WhatsAppQrCodeResponseDto {
  @ApiProperty({
    description: 'QR code string for WhatsApp authentication',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
    nullable: true,
    type: String,
  })
  readonly qrCode!: string | null;

  @ApiProperty({
    description: 'Timestamp when the QR code was generated',
    example: '2023-06-01T12:00:00.000Z',
    nullable: true,
    type: Date,
  })
  readonly updatedAt!: Date | null;
}
