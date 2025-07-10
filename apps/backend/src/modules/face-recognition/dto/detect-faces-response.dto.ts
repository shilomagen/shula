import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for face detection response
 */
export class DetectFacesResponseDto {
  @ApiProperty({
    description: 'Array of base64 encoded cropped face images',
    type: [String],
    example: [
      'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    ],
  })
  faces!: string[];
}
