import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ContextLogger } from 'nestjs-context-logger';
import {
  DetectFacesDto,
  DetectFacesResponseDto,
  ExtractFacesResponseDto,
  ExtractedFaceDto,
  RecognizeFaceDto,
  RecognizeFaceResponseDto,
  RecognizedPersonDto,
} from './dto';
import { FaceRecognitionService } from './services/face-recognition.service';

/**
 * Controller for face recognition operations
 */
@ApiTags('face-recognition')
@Controller('v1/face-recognition')
export class FaceRecognitionController {
  private readonly logger = new ContextLogger(FaceRecognitionController.name);

  constructor(
    private readonly faceRecognitionService: FaceRecognitionService
  ) {}

  @ApiOperation({
    summary: 'Extract faces from an image with detailed information',
    description:
      'Returns extracted faces with bounding boxes, confidence scores, and full face details from AWS Rekognition',
    operationId: 'extractFaces',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully extracted faces with details',
    type: ExtractFacesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or invalid image data',
  })
  @Post('extract-faces')
  async extractFaces(
    @Body() detectFacesDto: DetectFacesDto
  ): Promise<ExtractFacesResponseDto> {
    this.logger.log('Extracting faces with details from image');

    // Clean base64 string if needed
    const base64Data = detectFacesDto.imageBase64.replace(
      /^data:image\/\w+;base64,/,
      ''
    );

    // Use the refactored service to detect faces
    const detectedFaces = await this.faceRecognitionService.detectFaces(
      base64Data
    );

    this.logger.log(`Extracted ${detectedFaces.length} faces with details`);

    // Map detected faces to response DTO format
    const extractedFaces: ExtractedFaceDto[] = detectedFaces.map((face) => ({
      imageBase64: `data:image/jpeg;base64,${face.faceImage.toString(
        'base64'
      )}`,
      boundingBox: face.boundingBox,
      confidence: face.faceDetail.Confidence || 0,
      faceDetails: face.faceDetail,
    }));

    return { faces: extractedFaces };
  }

  @ApiOperation({
    summary: 'Recognize a single face',
    description:
      'Recognizes a single cropped face against a group (collection)',
    operationId: 'recognizeFace',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully recognized face',
    type: RecognizeFaceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request or invalid face image',
  })
  @Post('recognize-face')
  async recognizeFace(
    @Body() recognizeFaceDto: RecognizeFaceDto
  ): Promise<RecognizeFaceResponseDto> {
    this.logger.log(`Recognizing face in group ${recognizeFaceDto.groupId}`);

    // Clean base64 string if needed
    const base64Data = recognizeFaceDto.faceImageBase64.replace(
      /^data:image\/\w+;base64,/,
      ''
    );
    const faceImageBuffer = Buffer.from(base64Data, 'base64');

    // Use the face recognition service to recognize the face
    const recognizedPersons = await this.faceRecognitionService.recognizeFace(
      recognizeFaceDto.groupId,
      faceImageBuffer
    );

    // Map to response DTO
    const persons: RecognizedPersonDto[] = recognizedPersons.map((person) => ({
      personId: person.personId,
      confidence: person.confidence,
    }));

    this.logger.log(`Recognized ${persons.length} persons`);
    return { recognizedPersons: persons };
  }
}
