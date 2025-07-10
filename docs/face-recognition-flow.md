# Face Recognition Flow

This guide describes how a photo travels through the system from the WhatsApp container to delivery after face recognition.

## Entities

- **Participant** – a phone number in a WhatsApp group.
- **Group** – represents a WhatsApp group configured in the system.
- **GroupParticipant** – join table linking participants to groups.
- **Person** – a child/person linked to a participant. Each person becomes a *User* inside AWS Rekognition.

## Processing Steps

1. **WhatsApp Event**
   - The `whatsapp-container` receives a new image message.
   - The media is uploaded to a temporary S3 bucket and an event is published to the `whatsapp-message-processing` queue.
2. **Backend Intake**
   - The backend consumes the event and enqueues a job in the `FACE_RECOGNITION` queue with the S3 info.
3. **Recognition Processor**
   - `FaceRecognitionProcessor` downloads the image and calls `FaceRecognitionService.recognizeFaces`.
   - Faces are detected, cropped and each crop is sent to Rekognition `searchUsersByImage` to find matching users.
4. **Distribution**
   - For each recognized person a `MediaDistribution` record is created and the photo is sent privately to the related participant via the outbound messages queue.
5. **Cleanup**
   - Training images are stored in S3 with a short TTL and deleted after indexing. Group photos are retained only until delivered.

## Adding a Person

`ConnectPersonActionHandler` registers a new person through a conversation:

1. Create a `Person` linked to the requesting participant.
2. Download each uploaded image from S3.
3. Index the cropped faces using Rekognition and associate them with a Rekognition user whose id equals the person id.
4. Remove the uploaded images from S3 so no personal photos remain in storage.

## Removing a Person

Deleting a person triggers `PersonSideEffectsFlowService` which schedules jobs to:

1. Delete the Rekognition user.
2. Delete all associated faces from the collection.
3. Finally remove the Person entry from the database.

This ensures both metadata and biometric data are cleaned up when a person is removed.
