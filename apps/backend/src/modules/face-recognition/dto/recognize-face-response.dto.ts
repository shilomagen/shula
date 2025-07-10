import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for a recognized person
 */
export class RecognizedPersonDto {
  @ApiProperty({
    description: 'ID of the recognized person',
    example: 'person-123',
  })
  personId!: string;

  @ApiProperty({
    description: 'Confidence score of the recognition (0-100)',
    example: 95.7,
  })
  confidence!: number;
}

/**
 * DTO for face recognition response
 */
export class RecognizeFaceResponseDto {
  @ApiProperty({
    description: 'Array of recognized persons',
    type: [RecognizedPersonDto],
  })
  recognizedPersons!: RecognizedPersonDto[];
}
