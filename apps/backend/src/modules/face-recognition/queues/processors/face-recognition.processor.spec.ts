import {
  createMockFaceRecognitionJob,
  createMockFaceRecognitionProcessor,
} from './face-recognition.processor.driver';

describe('FaceRecognitionProcessor', () => {
  describe('process', () => {
    it('should process face recognition job successfully', async () => {
      // Arrange
      const { processor, mocks, recognizedPersons, given, get } =
        createMockFaceRecognitionProcessor();
      const mockJob = createMockFaceRecognitionJob();

      // Setup the test case
      given.recognizeFacesReturns(recognizedPersons);

      // Act
      const result = await processor.process(mockJob);

      // Assert
      expect(result.success).toBe(true);
      expect(result.messageId).toBe(mockJob.data.messageId);
      expect(result.groupId).toBe(mockJob.data.groupId);
      expect(result.recognizedPersons).toHaveLength(recognizedPersons.length);

      // Verify that recognizeFaces was called with the correct parameters
      const calledWith = get.recognizeFacesCalledWith();
      expect(calledWith).toMatchObject({
        groupId: mockJob.data.groupId,
        imageData: mockJob.data.imageMedia,
      });

      // Verify that other methods were called appropriately
      expect(
        mocks.participantsService.findParticipantByPersonId
      ).toHaveBeenCalledTimes(recognizedPersons.length);
      expect(
        mocks.groupParticipantsService.isParticipantInGroup
      ).toHaveBeenCalledTimes(recognizedPersons.length);
    });

    it('should handle participants not in the group', async () => {
      // Arrange
      const { processor, given, get } = createMockFaceRecognitionProcessor();
      const mockJob = createMockFaceRecognitionJob();

      // Mock participant1 not being in the group
      given.participantNotInGroup('participant1');

      // Act
      const result = await processor.process(mockJob);

      // Assert
      expect(result.success).toBe(true);
      // Only one message should be sent (to participant2)
      expect(get.outboundMessagesCount()).toBe(1);

      const messageDetails = get.outboundMessageCalledWith(0);
      expect(messageDetails).toMatchObject({
        phoneNumber: '+9876543210', // participant2's phone number
        text: '',
      });
    });

    it('should handle persons without participants', async () => {
      // Arrange
      const { processor, given, get } = createMockFaceRecognitionProcessor();
      const mockJob = createMockFaceRecognitionJob();

      // Mock no participant for person1
      given.noParticipantForPerson('person1');

      // Act
      const result = await processor.process(mockJob);

      // Assert
      expect(result.success).toBe(true);
      // Only one message should be sent (to participant2)
      expect(get.outboundMessagesCount()).toBe(1);

      const messageDetails = get.outboundMessageCalledWith(0);
      expect(messageDetails).toMatchObject({
        phoneNumber: '+9876543210', // participant2's phone number
        text: '',
      });
    });

    it('should handle face recognition errors', async () => {
      // Arrange
      const { processor, given } = createMockFaceRecognitionProcessor();
      const mockJob = createMockFaceRecognitionJob();
      const errorMessage = 'Face recognition failed';
      const error = new Error(errorMessage);

      // Setup the test to fail
      given.recognizeFacesFails(error);

      // Act
      const result = await processor.process(mockJob);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
      expect(result.recognizedPersons).toEqual([]);
    });
  });
});
