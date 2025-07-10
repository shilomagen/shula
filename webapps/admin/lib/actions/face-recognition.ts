'use server';

import { faceRecognitionApi, groupsApi, personsApi } from '@/lib/api-client';
import { RecognizedPersonDto } from '@/generated/http-clients/backend';

/**
 * Enhanced recognition result with person and participant details
 */
export interface EnhancedRecognizedPerson extends RecognizedPersonDto {
  personName?: string;
  participantId?: string;
  participantName?: string;
}

/**
 * Fetches all groups from the API
 * @returns List of groups
 */
export async function getGroups() {
  try {
    const response = await groupsApi.getAllGroups(1, 100);
    return response.data.items || [];
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }
}

/**
 * Detects faces in an image
 * @param imageBase64 Base64-encoded image data
 * @returns Extracted faces information
 */
export async function extractFaces(imageBase64: string) {
  try {
    const response = await faceRecognitionApi.extractFaces({
      imageBase64,
    });

    // Return the faces array or an empty array if none found
    return response.data.faces;
  } catch (error) {
    console.error('Error detecting faces:', error);
    throw error;
  }
}

/**
 * Recognizes a face within a specific group and fetches additional details
 * @param faceImageBase64 Base64-encoded image data of the face
 * @param groupId Group ID to search within
 * @returns Enhanced recognition results with person and participant details
 */
export async function recognizeFace(
  faceImageBase64: string,
  groupId: string
): Promise<EnhancedRecognizedPerson[]> {
  try {
    const response = await faceRecognitionApi.recognizeFace({
      faceImageBase64,
      groupId,
    });

    const recognizedPersons = response.data.recognizedPersons || [];

    // Enhance results with person and participant details
    const enhancedResults = await Promise.all(
      recognizedPersons.map(async (person) => {
        try {
          // Use admin identifier for the x-participant-id header
          const adminParticipantId = 'admin';

          // Try to get person details from the persons API
          const personResponse = await personsApi.getPersonById(
            adminParticipantId,
            person.personId
          );
          const personData = personResponse.data;

          // Create enhanced result
          const enhancedPerson: EnhancedRecognizedPerson = {
            ...person,
            personName: personData.name,
            participantId: personData.participant?.id,
            participantName: personData.participant?.name,
          };

          return enhancedPerson;
        } catch (error) {
          console.error(
            `Error fetching details for person ${person.personId}:`,
            error
          );
          // Return original recognition data if enhancement fails
          return person;
        }
      })
    );

    return enhancedResults;
  } catch (error) {
    console.error('Error recognizing face:', error);
    throw error;
  }
}
