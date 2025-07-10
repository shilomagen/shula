import { Injectable } from '@nestjs/common';
import { Participant, Person } from '@prisma/client';
import {
  PersonsResponseDto,
  ParticipantInfo,
} from './dto/persons-response.dto';

// Define the type for a Person with its participant
type PersonWithParticipant = Person & {
  participant?: Participant;
};

@Injectable()
export class PersonsMapper {
  toResponseDto(person: PersonWithParticipant): PersonsResponseDto {
    return {
      id: person.id,
      name: person.name,
      status: person.status,
      createdAt: person.createdAt,
      faceIds: person.faceIds || [],
      rekognitionCollectionId: person.rekognitionCollectionId || undefined,
      groupId: person.groupId,
      relationship: undefined, // This will need to be set separately if needed
      participant: person.participant
        ? this.mapParticipant(person.participant)
        : (undefined as any), // Force-cast to meet the type
    };
  }

  private mapParticipant(participant: Participant): ParticipantInfo {
    return {
      id: participant.id,
      name: participant.name,
      phoneNumber: participant.phoneNumber,
    };
  }

  /**
   * Convert a person entity to a DTO
   */
  toDto(person: PersonWithParticipant): PersonsResponseDto {
    return this.toResponseDto(person);
  }
}
