import { ApiProperty } from '@nestjs/swagger';
import { type BoundingBox } from '../interfaces/face-recognition.interfaces';
import type { FaceDetail } from '@aws-sdk/client-rekognition';


class BoundingBoxDto {
  @ApiProperty({
    description: 'Bounding box coordinates of the face in the original image',
    example: {
      x: 100,
      y: 150,
      width: 200,
      height: 250,
    },
  })
  x!: number;

  @ApiProperty({
    description: 'Y coordinate of the top-left corner of the bounding box',
    example: 150,
  })
  y!: number;

  @ApiProperty({
    description: 'Width of the bounding box',
    example: 200,
  })
  width!: number;

  @ApiProperty({
    description: 'Height of the bounding box',
    example: 250,
  })
  height!: number;
}

/**
 * DTO for a single extracted face
 */
export class ExtractedFaceDto {
  @ApiProperty({
    description: 'Base64 encoded cropped face image',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  imageBase64!: string;

  @ApiProperty({
    description: 'Bounding box coordinates of the face in the original image',
    example: {
      x: 100,
      y: 150,
      width: 200,
      height: 250,
    },
    type: BoundingBoxDto,
  })
  boundingBox!: BoundingBox;

  @ApiProperty({
    description: 'Confidence score of face detection (0-100)',
    type: 'number',
    example: 99.8,
  })
  confidence!: number;

  @ApiProperty({
    description: 'Face details from AWS Rekognition',
    type: 'object',
    additionalProperties: true,
    example: {
      BoundingBox: { Width: 0.8, Height: 0.8, Left: 0.1, Top: 0.1 },
      Confidence: 99.8,
      AgeRange: { Low: 20, High: 30 },
      // Other properties from FaceDetail...
    },
  })
  faceDetails!: FaceDetail;
}

/**
 * DTO for face extraction response
 */
export class ExtractFacesResponseDto {
  @ApiProperty({
    description: 'Array of extracted faces with details',
    type: [ExtractedFaceDto],
  })
  faces!: ExtractedFaceDto[];
}
