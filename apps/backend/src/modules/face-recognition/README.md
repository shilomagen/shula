# Face Recognition Module

This module provides integration with AWS Rekognition for face detection, indexing, and user management.

## Features

- Index up to 3 faces in a collection
- Process multiple images for a single person
- Create users and associate multiple faces with them
- Search for users by face image
- Automatic collection creation if it doesn't exist
- Prefixed collection IDs for organization
- Integration with Persons module for person identification

## How Users and Collections Work

In AWS Rekognition:
- A **Collection** is a container for face data (like a group or organization)
- A **User** is associated with a specific collection and can have multiple faces
- Each user is identified by a unique `userId` (which is your person ID)
- Users are automatically associated with a collection when created in that collection

## Integration with Persons Module

The Face Recognition module is integrated with the Persons module to provide face indexing capabilities for persons:

- The `PersonsService` uses the `RekognitionService` to index faces for persons
- Each person can have multiple faces indexed and associated with them
- Multiple images (up to 3) can be processed in a single request
- The person ID is used as the user ID in AWS Rekognition
- Collections are used to organize persons by groups

### API Endpoint

```
POST /v1/persons/:id/face
```

This endpoint accepts a JSON body with:
- `collectionId`: The collection/group ID to use for organizing faces
- `images`: Array of base64 encoded images (up to 3)

Example request body:
```json
{
  "collectionId": "group-123",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  ]
}
```

### Response

```json
{
  "personId": "person-123",
  "faceIds": ["face-id-1", "face-id-2", "face-id-3"],
  "associatedFaces": [
    { "FaceId": "face-id-1" },
    { "FaceId": "face-id-2" },
    { "FaceId": "face-id-3" }
  ]
}
```

## Usage

### Import the module

```typescript
import { Module } from '@nestjs/common';
import { FaceRecognitionModule } from '../face-recognition/face-recognition.module';

@Module({
  imports: [FaceRecognitionModule],
  // ...
})
export class YourModule {}
```

### Inject and use the service

```typescript
import { Injectable } from '@nestjs/common';
import { RekognitionService } from '../face-recognition/rekognition.service';
import * as fs from 'fs';

@Injectable()
export class YourService {
  constructor(private readonly rekognitionService: RekognitionService) {}

  async processPersonImages(personId: string, imagePaths: string[], collectionId: string): Promise<string> {
    const faceIds: string[] = [];
    
    // Index faces from each image
    for (const imagePath of imagePaths) {
      // Read image file
      const imageBuffer = fs.readFileSync(imagePath);
      
      // Index faces (up to 3 per image)
      const faceRecords = await this.rekognitionService.indexFaces(
        collectionId,
        imageBuffer
      );
      
      // Collect face IDs
      faceRecords.forEach(record => {
        if (record.Face?.FaceId) {
          faceIds.push(record.Face.FaceId);
        }
      });
    }
    
    // Create a user and associate all the indexed faces
    // This automatically associates the user with the collection
    const result = await this.rekognitionService.createUserWithFaces(
      collectionId,
      personId,
      faceIds
    );
    
    return result.userId;
  }
  
  async findPersonByFace(imagePath: string, collectionId: string): Promise<string | null> {
    // Read image file
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Search for users by face in the specified collection
    const userMatches = await this.rekognitionService.searchUsersByImage(
      collectionId,
      imageBuffer
    );
    
    // Return the highest confidence match, if any
    if (userMatches.length > 0) {
      return userMatches[0].UserId || null;
    }
    
    return null;
  }
}
```

## Environment Variables

The module requires the following environment variables:

- `AWS_REKOGNITION_ACCESS_KEY`: AWS access key with Rekognition permissions
- `AWS_REKOGNITION_SECRET_KEY`: AWS secret key
- `AWS_REKOGNITION_REGION`: AWS region (defaults to 'us-east-1')
- `AWS_REKOGNITION_COLLECTION_PREFIX`: Prefix for collection IDs (defaults to 'shula-') 