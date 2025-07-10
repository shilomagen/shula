import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';

export class PersonsFaceIndexDto {
  @ApiProperty({
    description: 'The collection/group ID to use for organizing faces',
    example: 'group-123',
  })
  @IsNotEmpty()
  @IsString()
  collectionId!: string;

  @ApiProperty({
    description: 'Array of base64 encoded images (up to 3)',
    example: [
      'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
    ],
    type: [String],
    maxItems: 3,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  images!: string[];
}
