import { Job } from 'bullmq';
import { mock } from 'jest-mock-extended';
import { GroupParticipantsService } from '../../../group-participants/group-participants.service';
import { OutboundMessageService } from '../../../outbound-messages/services/outbound-message.service';
import { ParticipantsService } from '../../../participants/participants.service';
import { RecognizedPerson } from '../../interfaces/face-recognition.interfaces';
import { FaceRecognitionService } from '../../services/face-recognition.service';
import { FaceRecognitionProcessor } from './face-recognition.processor';

/**
 * Create a mock face recognition processor with mocked dependencies
 */
export const createMockFaceRecognitionProcessor = () => {
  const faceRecognitionService = mock<FaceRecognitionService>();
  const participantsService = mock<ParticipantsService>();
  const groupParticipantsService = mock<GroupParticipantsService>();
  const outboundMessageService = mock<OutboundMessageService>();

  const recognizedPersons: RecognizedPerson[] = [
    { personId: 'person1', confidence: 0.9 },
    { personId: 'person2', confidence: 0.85 },
  ];

  // Setup the face recognition service
  faceRecognitionService.recognizeFaces.mockResolvedValue(recognizedPersons);

  // Setup the participants service
  const participants = [
    {
      id: 'participant1',
      name: 'Participant 1',
      phoneNumber: '+1234567890',
      status: 'active',
      joinedAt: new Date(),
    },
    {
      id: 'participant2',
      name: 'Participant 2',
      phoneNumber: '+9876543210',
      status: 'active',
      joinedAt: new Date(),
    },
  ];

  // Mock findParticipantByPersonId to return participant
  participantsService.findParticipantByPersonId.mockImplementation(
    async (personId: string, groupId: string) => {
      const index =
        personId === 'person1' ? 0 : personId === 'person2' ? 1 : -1;
      return index >= 0 ? participants[index] : null;
    }
  );

  // Setup group participants service to return true by default
  groupParticipantsService.isParticipantInGroup.mockResolvedValue(true);

  // Create the processor with the mocked dependencies
  const processor = new FaceRecognitionProcessor(
    faceRecognitionService,
    participantsService,
    groupParticipantsService,
    outboundMessageService
  );

  return {
    processor,
    mocks: {
      faceRecognitionService,
      participantsService,
      groupParticipantsService,
      outboundMessageService,
    },
    recognizedPersons,
    participants,
    // Helper methods for setting up test cases
    given: {
      recognizeFacesReturns: (persons: RecognizedPerson[]) => {
        faceRecognitionService.recognizeFaces.mockResolvedValue(persons);
        return persons;
      },
      recognizeFacesFails: (error: Error) => {
        faceRecognitionService.recognizeFaces.mockRejectedValue(error);
        return error;
      },
      participantNotInGroup: (participantId: string) => {
        groupParticipantsService.isParticipantInGroup.mockImplementation(
          async (pId) => pId !== participantId
        );
      },
      noParticipantForPerson: (personId: string) => {
        participantsService.findParticipantByPersonId.mockImplementation(
          async (pId: string, groupId: string) => {
            if (pId === personId) return null;
            const index = pId === 'person1' ? 0 : pId === 'person2' ? 1 : -1;
            return index >= 0 ? participants[index] : null;
          }
        );
      },
    },
    get: {
      recognizeFacesCalledWith: () => {
        if (faceRecognitionService.recognizeFaces.mock.calls.length === 0) {
          return null;
        }
        return {
          groupId: faceRecognitionService.recognizeFaces.mock.calls[0][0],
          imageData: faceRecognitionService.recognizeFaces.mock.calls[0][1],
        };
      },
      outboundMessagesCount: () => {
        return outboundMessageService.sendMessage.mock.calls.length;
      },
      outboundMessageCalledWith: (index = 0) => {
        if (outboundMessageService.sendMessage.mock.calls.length <= index) {
          return null;
        }
        return {
          phoneNumber: outboundMessageService.sendMessage.mock.calls[index][0],
          text: outboundMessageService.sendMessage.mock.calls[index][1],
          media: outboundMessageService.sendMessage.mock.calls[index][2],
        };
      },
    },
  };
};

/**
 * Create a mock job for face recognition
 */
export const createMockFaceRecognitionJob = (override?: Partial<any>) => {
  const defaultJob = {
    id: 'test-job-id',
    data: {
      messageId: 'test-message-id',
      groupId: 'test-group-id',
      chatId: 'test-chat-id',
      mediaUrl: 'https://example.com/test-image.jpg',
      imageMedia: {
        mediaUrl: 'https://example.com/test-image.jpg',
        mimeType: 'image/jpeg',
        caption: 'Test image',
      },
      senderPhoneNumber: '+1234567890',
    },
  };

  return {
    ...defaultJob,
    ...override,
  } as unknown as Job<any>;
};
