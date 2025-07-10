import { ApiProperty } from '@nestjs/swagger';
import { EntityStatus } from '@prisma/client';

export class ParticipantInfo {
  @ApiProperty({
    description: 'The participant ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id!: string;

  @ApiProperty({
    description: 'The name of the participant',
    example: 'John Doe',
  })
  name!: string;

  @ApiProperty({
    description: 'The phone number of the participant',
    example: '+1234567890',
  })
  phoneNumber!: string;
}

export class PersonsResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the person',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id!: string;

  @ApiProperty({
    description: 'The name of the person',
    example: 'John Doe Jr.',
  })
  name!: string;

  @ApiProperty({
    description: 'The status of the person',
    example: 'active',
    enum: EntityStatus,
  })
  status!: EntityStatus;

  @ApiProperty({
    description: 'The date the person was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description:
      'Array of AWS Rekognition face IDs associated with this person',
    example: ['face-id-1', 'face-id-2'],
    type: [String],
    required: false,
  })
  faceIds?: string[];

  @ApiProperty({
    description:
      'The AWS Rekognition collection ID where the face data is stored',
    example: 'group-123',
    required: false,
  })
  rekognitionCollectionId?: string;

  @ApiProperty({
    description: 'The group ID associated with this person',
    example: 'g47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  groupId!: string;

  @ApiProperty({
    description: 'The participant who owns this person',
    type: ParticipantInfo,
  })
  participant!: ParticipantInfo;

  @ApiProperty({
    description: 'The relationship between the participant and the person',
    example: 'parent',
    required: false,
  })
  relationship?: string;
}
