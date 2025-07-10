import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO for face detection request
 */
export class DetectFacesDto {
  @ApiProperty({
    description: 'Base64 encoded image data',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  @IsNotEmpty()
  @IsString()
  imageBase64!: string;
}
