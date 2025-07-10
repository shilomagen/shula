import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for face recognition request
 */
export class RecognizeFaceDto {
  @ApiProperty({
    description: 'Base64 encoded image data of a cropped face',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  @IsNotEmpty()
  @IsString()
  faceImageBase64!: string;

  @ApiProperty({
    description: 'Group ID (collection ID) to search in',
    example: 'group-123',
  })
  @IsNotEmpty()
  @IsString()
  groupId!: string;
}
