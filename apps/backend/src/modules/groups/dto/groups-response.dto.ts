import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';

export class GroupsResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'WhatsApp group ID',
    example: '123456789@g.us',
  })
  whatsappGroupId!: string;

  @ApiProperty({
    description: 'Group name',
    example: 'School Parents Group',
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'Group description',
    example: 'A group for parents of students in Class 5A',
  })
  description?: string;

  @ApiProperty({
    description: 'Group status',
    example: 'active',
  })
  status!: string;

  @ApiProperty({
    description: 'Group creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: Date;
}
