import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ParticipantId,
  ApiParticipantId,
} from '../../common/decorators/participant-id.decorator';
import {
  PersonsCreateDto,
  PersonsFaceIndexDto,
  PersonsResponseDto,
  PersonsUpdateDto,
} from './dto';
import { PersonsService } from './persons.service';

@ApiTags('persons')
@Controller('v1/persons')
@ApiParticipantId()
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @ApiOperation({
    summary: 'Get all persons',
    operationId: 'getAllPersons',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of persons',
    type: PersonsResponseDto,
    isArray: true,
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @ApiQuery({ name: 'participantId', required: false, type: String })
  @Get()
  async findAll(
    @ParticipantId() participantId: string,
    @Query('page') page?: string,
    @Query('size') size?: string
  ): Promise<PersonsResponseDto[]> {
    return this.personsService.findAll(
      page ? parseInt(page, 10) : 1,
      size ? parseInt(size, 10) : 10,
      participantId
    );
  }

  @ApiOperation({
    summary: 'Get a person by ID',
    operationId: 'getPersonById',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the person details',
    type: PersonsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Person not found' })
  @ApiParam({ name: 'id', description: 'Person ID' })
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PersonsResponseDto> {
    return this.personsService.findOne(id);
  }

  @ApiOperation({
    summary: 'Create a new person',
    operationId: 'createPerson',
  })
  @ApiResponse({
    status: 201,
    description: 'The person has been created',
    type: PersonsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  @ApiResponse({ status: 400, description: 'Invalid person data' })
  @Post()
  async create(
    @Body() createPersonDto: PersonsCreateDto
  ): Promise<PersonsResponseDto> {
    return this.personsService.create(createPersonDto);
  }

  @ApiOperation({
    summary: 'Update a person',
    operationId: 'updatePerson',
  })
  @ApiResponse({
    status: 200,
    description: 'The person has been updated',
    type: PersonsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Person not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 400, description: 'Invalid person data' })
  @ApiParam({ name: 'id', description: 'Person ID' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePersonDto: PersonsUpdateDto,
    @ParticipantId() participantId: string
  ): Promise<PersonsResponseDto> {
    return this.personsService.update(id, updatePersonDto, participantId);
  }

  @ApiOperation({
    summary: 'Delete a person',
    operationId: 'deletePerson',
  })
  @ApiResponse({ status: 204, description: 'The person has been deleted' })
  @ApiResponse({ status: 404, description: 'Person not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiParam({ name: 'id', description: 'Person ID' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @ParticipantId() participantId: string
  ): Promise<void> {
    return this.personsService.remove(id, participantId);
  }

  @ApiOperation({
    summary: 'Get all persons associated with a participant',
    operationId: 'getPersonsByParticipant',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of persons',
    type: PersonsResponseDto,
    isArray: true,
  })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  @ApiParam({ name: 'id', description: 'Participant ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'size', required: false, type: Number })
  @Get('/by-participant/:id')
  async findByParticipant(
    @Param('id') participantId: string,
    @Query('page') page = 1,
    @Query('size') size = 10
  ): Promise<PersonsResponseDto[]> {
    return this.personsService.findByParticipant(participantId, +page, +size);
  }

  @ApiOperation({
    summary: "Index a person's face using AWS Rekognition",
    operationId: 'indexPersonFace',
  })
  @ApiResponse({
    status: 200,
    description: 'The face has been indexed',
    schema: {
      type: 'object',
      properties: {
        personId: { type: 'string' },
        faceIds: { type: 'array', items: { type: 'string' } },
        associatedFaces: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              FaceId: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Person not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 400, description: 'Bad request or no faces detected' })
  @ApiParam({ name: 'id', description: 'Person ID' })
  @ApiBody({ type: PersonsFaceIndexDto })
  @Post(':id/face')
  async indexFace(
    @Param('id') id: string,
    @Body() personsFaceIndexDto: PersonsFaceIndexDto,
    @ParticipantId() participantId: string
  ) {
    return this.personsService.indexPersonFace(
      id,
      personsFaceIndexDto.collectionId,
      personsFaceIndexDto.images,
      participantId
    );
  }
}
