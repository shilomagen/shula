import { AssociatedFace, FaceRecord } from '@aws-sdk/client-rekognition';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EntityStatus } from '@prisma/client';
import { ContextLogger } from 'nestjs-context-logger';
import { PrismaService } from '../../database/prisma.service';
import { FaceRecognitionService } from '../face-recognition/services/face-recognition.service';
import { PersonsCreateDto, PersonsResponseDto, PersonsUpdateDto } from './dto';
import { PersonsMapper } from './persons.mapper';
import { PersonSideEffectsFlowService } from './queues/person-side-effects-flow.service';

@Injectable()
export class PersonsService {
  private readonly logger = new ContextLogger(PersonsService.name);

  constructor(
    private prisma: PrismaService,
    private personsMapper: PersonsMapper,
    private faceRecognitionService: FaceRecognitionService,
    private personSideEffectsFlowService: PersonSideEffectsFlowService
  ) {}

  /**
   * Index a person's face using AWS Rekognition with multiple images
   * @param personId - The ID of the person to index
   * @param collectionId - The collection/group ID to use for organizing faces
   * @param base64Images - Array of base64 encoded images containing the faces to index
   * @param requestingParticipantId - The ID of the participant making the request
   * @returns Object containing the person ID and associated face IDs
   */
  async indexPersonFace(
    personId: string,
    collectionId: string,
    base64Images: string[],
    requestingParticipantId: string
  ): Promise<{
    personId: string;
    faceIds: string[];
    associatedFaces: AssociatedFace[];
  }> {
    // Check if the person exists
    const existingPerson = await this.prisma.person.findUnique({
      where: { id: personId },
    });

    if (!existingPerson) {
      throw new NotFoundException(`Person with ID ${personId} not found`);
    }

    // Check if the requesting participant is the owner of this person
    if (existingPerson.participantId !== requestingParticipantId) {
      throw new ForbiddenException(
        'You do not have permission to index this person'
      );
    }

    try {
      const allFaceIds: string[] = [];

      // Process each base64 image
      for (const base64Image of base64Images) {
        // Extract the base64 data (remove data:image/jpeg;base64, prefix if present)
        const base64Data = base64Image.includes('base64,')
          ? base64Image.split('base64,')[1]
          : base64Image;

        // Index the face(s) in the image using FaceRecognitionService
        const faceRecords = await this.faceRecognitionService.indexFaces(
          collectionId,
          base64Data,
          personId
        );

        // Extract face IDs from the records
        const faceIds = faceRecords
          .filter((record: FaceRecord) => record.Face?.FaceId)
          .map((record: FaceRecord) => record.Face!.FaceId!);

        // Add to the collection of all face IDs
        allFaceIds.push(...faceIds);
      }

      if (allFaceIds.length === 0) {
        throw new BadRequestException('No faces detected in any of the images');
      }

      // Create or update the user in Rekognition and associate the faces using FaceRecognitionService
      const result = await this.faceRecognitionService.createUserWithFaces(
        collectionId,
        personId,
        allFaceIds
      );

      // Update the person record with the face IDs and collection ID using Prisma's native API
      await this.prisma.person.update({
        where: { id: personId },
        data: {
          faceIds: allFaceIds,
          rekognitionCollectionId: collectionId,
        },
      });

      return {
        personId,
        faceIds: allFaceIds,
        associatedFaces: result.associatedFaces,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new Error(`Failed to index person's face: ${errorMessage}`);
    }
  }

  async findAll(
    page = 1,
    size = 10,
    participantId?: string
  ): Promise<PersonsResponseDto[]> {
    let where = {};

    // If participantId is provided, filter by that participant
    if (participantId) {
      where = {
        participantId,
      };
    }

    const persons = await this.prisma.person.findMany({
      where,
      include: {
        participant: true,
      },
      skip: (page - 1) * size,
      take: size,
    });

    return persons.map((person) => this.personsMapper.toResponseDto(person));
  }

  /**
   * Find a person by its ID, participant ID, and group ID
   * @param params Object containing personId, participantId, and groupId
   * @returns PersonsResponseDto if found, null otherwise
   */
  async find(params: {
    personId: string;
    groupId: string;
    participantId?: string;
  }): Promise<PersonsResponseDto | null> {
    const { personId, participantId, groupId } = params;

    const whereClause: any = {
      id: personId,
      groupId,
    };

    if (participantId) {
      whereClause.participantId = participantId;
    }

    const person = await this.prisma.person.findFirst({
      where: whereClause,
      include: {
        participant: true,
      },
    });

    if (!person) {
      return null;
    }

    return this.personsMapper.toResponseDto(person);
  }

  async findOne(id: string): Promise<PersonsResponseDto> {
    const person = await this.prisma.person.findUnique({
      where: { id },
      include: {
        participant: true,
      },
    });

    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }

    return this.personsMapper.toResponseDto(person);
  }

  async findByParticipant(
    participantId: string,
    page = 1,
    size = 10
  ): Promise<PersonsResponseDto[]> {
    const persons = await this.prisma.person.findMany({
      where: {
        participantId,
      },
      include: {
        participant: true,
      },
      skip: (page - 1) * size,
      take: size,
    });

    return persons.map((person) => this.personsMapper.toResponseDto(person));
  }

  async create(createPersonDto: PersonsCreateDto): Promise<PersonsResponseDto> {
    // First, verify the participant exists
    const participant = await this.prisma.participant.findUnique({
      where: { id: createPersonDto.participantId },
    });

    if (!participant) {
      throw new NotFoundException(
        `Participant with ID ${createPersonDto.participantId} not found`
      );
    }

    // Create the person with direct participantId and groupId fields
    const person = await this.prisma.person.create({
      data: {
        name: createPersonDto.name,
        status: createPersonDto.status || EntityStatus.active,
        participantId: createPersonDto.participantId,
        groupId: createPersonDto.groupId,
      },
      include: {
        participant: true,
      },
    });

    return this.personsMapper.toResponseDto(person);
  }

  async update(
    id: string,
    updatePersonDto: PersonsUpdateDto,
    requestingParticipantId: string
  ): Promise<PersonsResponseDto> {
    // First, check if the person exists
    const existingPerson = await this.prisma.person.findUnique({
      where: { id },
    });

    if (!existingPerson) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }

    // Check if the requesting participant is the owner of this person
    if (existingPerson.participantId !== requestingParticipantId) {
      throw new ForbiddenException(
        'You do not have permission to update this person'
      );
    }

    // Update the person
    const updatedPerson = await this.prisma.person.update({
      where: { id },
      data: {
        ...(updatePersonDto.name && { name: updatePersonDto.name }),
        ...(updatePersonDto.status && { status: updatePersonDto.status }),
      },
      include: {
        participant: true,
      },
    });

    return this.personsMapper.toResponseDto(updatedPerson);
  }

  async remove(id: string, requestingParticipantId: string): Promise<void> {
    const existingPerson = await this.prisma.person.findUnique({
      where: { id },
    });

    if (!existingPerson) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }

    // Check if the requesting participant is the owner
    if (existingPerson.participantId !== requestingParticipantId) {
      throw new ForbiddenException('Only the owner can delete this person');
    }

    try {
      if (
        existingPerson.rekognitionCollectionId &&
        existingPerson.faceIds.length > 0
      ) {
        try {
          await this.personSideEffectsFlowService.queuePersonDeletionFlow(
            id,
            existingPerson.rekognitionCollectionId,
            existingPerson.faceIds
          );
          this.logger.debug(
            `Queued deletion flow for person ${id} from AWS Rekognition`
          );
        } catch (error: unknown) {
          // Log the error but continue with database deletion
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          const errorStack = error instanceof Error ? error.stack : undefined;
          this.logger.error(
            `Error queueing person deletion flow for Rekognition: ${errorMessage}`,
            { errorStack }
          );
        }
      }

      // Delete the person from the database
      await this.prisma.person.delete({
        where: { id },
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error removing person: ${errorMessage}`, {
        errorStack,
      });
      throw new Error(`Failed to remove person: ${errorMessage}`);
    }
  }

  /**
   * Remove all persons associated with a participant in a specific group
   * @param participantId The participant ID
   * @param groupId The group ID
   */
  async removePersonsByParticipantAndGroup(
    participantId: string,
    groupId: string
  ): Promise<void> {
    // Find all persons matching the criteria
    const persons = await this.prisma.person.findMany({
      where: {
        participantId,
        groupId,
      },
    });

    for (const person of persons) {
      if (person.rekognitionCollectionId && person.faceIds.length > 0) {
        try {
          await this.personSideEffectsFlowService.queuePersonDeletionFlow(
            person.id,
            person.rekognitionCollectionId,
            person.faceIds
          );
          this.logger.debug(
            `Queued deletion flow for person ${person.id} from AWS Rekognition`
          );
        } catch (error: unknown) {
          // Log the error but continue with database deletion
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.error(
            `Error queueing person deletion flow for Rekognition: ${errorMessage}`,
            { error }
          );
        }
      }
    }

    // Delete all persons matching the criteria
    await this.prisma.person.deleteMany({
      where: {
        participantId,
        groupId,
      },
    });

    this.logger.debug(
      `Removed ${persons.length} persons for participant ${participantId} in group ${groupId}`
    );
  }
}
