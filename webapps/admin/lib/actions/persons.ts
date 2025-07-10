'use server';

import { personsApi } from '../api-client';

/**
 * Get all persons associated with a participant
 * @param xParticipantId Unique identifier for the participant making the request
 * @param participantId ID of the participant to get persons for
 * @returns Array of persons
 */
export async function getPersonsByParticipant(
  xParticipantId: string,
  participantId: string
) {
  try {
    const response = await personsApi.getPersonsByParticipant(
      xParticipantId,
      participantId
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching persons for participant ${participantId}:`,
      error
    );
    throw error;
  }
}

/**
 * Delete a person
 * @param xParticipantId Unique identifier for the participant making the request
 * @param personId ID of the person to delete
 * @returns void
 */
export async function deletePerson(xParticipantId: string, personId: string) {
  try {
    await personsApi.deletePerson(xParticipantId, personId);
  } catch (error) {
    console.error(`Error deleting person ${personId}:`, error);
    throw error;
  }
}

// ... existing code ...
