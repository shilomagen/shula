# Shula - Technical Specifications

## System Components

### 1. Domain Model

#### Entities

- **Group**
  - Represents a WhatsApp group
  - Properties: groupId, name, description, createdAt, status
  - Relationships: Many-to-many with Participants

- **Participant**
  - Represents a WhatsApp user (typically a parent)
  - Properties: id, phoneNumber, name, joinedAt, status
  - Relationships: Many-to-many with Groups, Many-to-many with Persons

- **Person**
  - Represents an individual to be recognized (typically a child)
  - Properties: id, name, status, createdAt
  - Relationships: Many-to-many with Participants, One-to-many with FaceData

- **ParticipantPerson**
  - Junction entity tracking which persons are associated with which participants
  - Properties: participantId, personId, relationship, isCreator, createdAt
  - Relationships: Many-to-one with both Participant and Person
  - Note: isCreator flag identifies the participant who originally created the person

- **FaceData**
  - Represents facial recognition data for a Person
  - Properties: id, personId, featureVector, quality, createdAt
  - Relationships: Many-to-one with Person

- **Photo**
  - Represents a processed image
  - Properties: id, originalUrl, processingStatus, sourceGroupId, uploadedBy, uploadedAt
  - Relationships: Many-to-many with Persons (through PhotoPerson junction)

- **PhotoPerson**
  - Junction entity tracking which persons appear in which photos
  - Properties: photoId, personId, confidenceScore, boundingBox
  - Relationships: Many-to-one with both Photo and Person

### 2. Database Schema

For a PostgreSQL implementation:

```sql
-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY,
  whatsapp_group_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'active'
);

-- Participants table
CREATE TABLE participants (
  id UUID PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'active'
);

-- Group-Participant relationship (many-to-many)
CREATE TABLE group_participants (
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, participant_id)
);

-- Persons table (people to be recognized)
CREATE TABLE persons (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Participant-Person relationship (many-to-many)
CREATE TABLE participant_persons (
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  relationship VARCHAR(50), -- e.g., 'parent', 'guardian', etc.
  is_creator BOOLEAN NOT NULL DEFAULT FALSE, -- identifies the original creator
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (participant_id, person_id)
);

-- Face data for recognition
CREATE TABLE face_data (
  id UUID PRIMARY KEY,
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  feature_vector BYTEA NOT NULL, -- Binary representation of face features
  quality FLOAT NOT NULL, -- Quality score of the face data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY,
  original_url TEXT NOT NULL,
  processing_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  source_group_id UUID REFERENCES groups(id),
  uploaded_by UUID REFERENCES participants(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Photo-Person relationships (which persons appear in which photos)
CREATE TABLE photo_persons (
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  person_id UUID REFERENCES persons(id) ON DELETE CASCADE,
  confidence_score FLOAT NOT NULL,
  bounding_box JSONB, -- JSON with x, y, width, height
  PRIMARY KEY (photo_id, person_id)
);
```

### 3. API Design

#### REST API Endpoints

The API follows REST principles with resource-oriented URLs, appropriate HTTP methods, and consistent response formats.

##### Groups Resource

- `GET /api/v1/groups` - List all groups
  - Status: 200 OK
  - Response: GroupResponseDto[]
  - Pagination: page/size query parameters

- `GET /api/v1/groups/:id` - Get group details
  - Status: 200 OK
  - Response: GroupResponseDto
  - Status: 404 Not Found (if group doesn't exist)

- `POST /api/v1/groups` - Create a new group
  - Status: 201 Created
  - Request Body: CreateGroupDto
  - Response: GroupResponseDto

- `PUT /api/v1/groups/:id` - Update group details
  - Status: 200 OK
  - Request Body: UpdateGroupDto
  - Response: GroupResponseDto
  - Status: 404 Not Found (if group doesn't exist)

- `PATCH /api/v1/groups/:id/status` - Update group status
  - Status: 200 OK
  - Request Body: UpdateGroupStatusDto
  - Response: GroupResponseDto
  - Status: 404 Not Found (if group doesn't exist)

- `DELETE /api/v1/groups/:id` - Delete a group
  - Status: 204 No Content
  - Status: 404 Not Found (if group doesn't exist)

##### Participants Resource

- `GET /api/v1/participants` - List all participants
  - Status: 200 OK
  - Response: ParticipantResponseDto[]
  - Pagination: page/size query parameters

- `GET /api/v1/participants/:id` - Get participant details
  - Status: 200 OK
  - Response: ParticipantResponseDto
  - Status: 404 Not Found (if participant doesn't exist)

- `POST /api/v1/participants` - Create a new participant
  - Status: 201 Created
  - Request Body: CreateParticipantDto
  - Response: ParticipantResponseDto

- `PUT /api/v1/participants/:id` - Update participant details
  - Status: 200 OK
  - Request Body: UpdateParticipantDto
  - Response: ParticipantResponseDto
  - Status: 404 Not Found (if participant doesn't exist)

- `DELETE /api/v1/participants/:id` - Remove a participant
  - Status: 204 No Content
  - Status: 404 Not Found (if participant doesn't exist)

##### Persons Resource

- `GET /api/v1/persons` - List all persons
  - Status: 200 OK
  - Response: PersonResponseDto[]
  - Pagination: page/size query parameters
  - Filters: Optionally filter by participantId

- `GET /api/v1/persons/:id` - Get person details
  - Status: 200 OK
  - Response: PersonResponseDto (includes associated participants)
  - Status: 404 Not Found (if person doesn't exist)

- `POST /api/v1/persons` - Create a new person
  - Status: 201 Created
  - Request Body: CreatePersonDto (includes creator participantId)
  - Response: PersonResponseDto
  
- `PUT /api/v1/persons/:id` - Update person details
  - Status: 200 OK
  - Request Body: UpdatePersonDto
  - Response: PersonResponseDto
  - Status: 404 Not Found (if person doesn't exist)
  - Status: 403 Forbidden (if requester is not associated with the person)

- `DELETE /api/v1/persons/:id` - Remove a person
  - Status: 204 No Content
  - Status: 404 Not Found (if person doesn't exist)
  - Status: 403 Forbidden (if requester is not the creator of the person)

- `POST /api/v1/persons/:id/face-data` - Add face recognition data for a person
  - Status: 201 Created
  - Request Body: CreateFaceDataDto
  - Response: FaceDataResponseDto
  - Status: 404 Not Found (if person doesn't exist)
  - Status: 403 Forbidden (if requester is not associated with the person)

- `POST /api/v1/persons/:id/share` - Share a person with another participant
  - Status: 200 OK
  - Request Body: SharePersonDto (contains target participantId and relationship)
  - Response: PersonResponseDto (updated with new participant association)
  - Status: 404 Not Found (if person or target participant doesn't exist)
  - Status: 403 Forbidden (if requester is not associated with the person)

- `DELETE /api/v1/persons/:id/participants/:participantId` - Remove a participant's association with a person
  - Status: 204 No Content
  - Status: 404 Not Found (if person or association doesn't exist)
  - Status: 403 Forbidden (if requester is not authorized or tries to remove the creator)

- `GET /api/v1/participants/:id/persons` - Get all persons associated with a participant
  - Status: 200 OK
  - Response: PersonResponseDto[]
  - Pagination: page/size query parameters
  - Status: 404 Not Found (if participant doesn't exist)

##### Photos Resource

- `GET /api/v1/photos` - List all photos
  - Status: 200 OK
  - Response: PhotoResponseDto[]
  - Pagination: page/size query parameters

- `GET /api/v1/photos/:id` - Get photo details
  - Status: 200 OK
  - Response: PhotoResponseDto
  - Status: 404 Not Found (if photo doesn't exist)

- `POST /api/v1/photos` - Register a new photo
  - Status: 201 Created
  - Request Body: CreatePhotoDto
  - Response: PhotoResponseDto

- `GET /api/v1/photos/by-person/:personId` - Get all photos containing a specific person
  - Status: 200 OK
  - Response: PhotoResponseDto[]
  - Pagination: page/size query parameters
  - Status: 404 Not Found (if person doesn't exist)

#### Data Transfer Objects (DTOs)

Following the NestJS best practices, we separate DTOs for requests and responses:

##### Request DTOs

- **CreateGroupDto**: For creating new WhatsApp groups
- **UpdateGroupDto**: For updating existing groups
- **UpdateGroupStatusDto**: For activating/deactivating groups
- **CreateParticipantDto**: For creating new participants
- **UpdateParticipantDto**: For updating participant information
- **CreatePersonDto**: For registering new persons (children)
  - Properties: name, participantId (creator), relationship, status
- **UpdatePersonDto**: For updating person information
  - Properties: name, status
- **SharePersonDto**: For sharing a person with another participant
  - Properties: participantId, relationship
- **CreateFaceDataDto**: For adding face recognition data
- **CreatePhotoDto**: For registering new photos

##### Response DTOs

- **GroupResponseDto**: For group information responses
- **ParticipantResponseDto**: For participant information responses
- **PersonResponseDto**: For person information responses
  - Includes array of associated participants with their relationships
- **ParticipantPersonRelationDto**: For person-participant relationship information
  - Properties: participantId, personId, relationship, isCreator, createdAt
- **FaceDataResponseDto**: For face data information responses
- **PhotoResponseDto**: For photo information responses

#### Swagger Documentation

All API endpoints will be documented using Swagger with:
- Detailed operation descriptions
- Request and response schemas
- Example values
- Authentication requirements
- Error responses

### 4. Event-Driven Architecture and Queue Structure

#### Event Bus

The system uses a custom event bus implementation based on RxJS to facilitate decoupled communication between modules:

- **EventBusService**: Central service for publishing and subscribing to events
  - `publish(type: string, payload: any)`: Publishes an event to the bus
  - `ofType<T>(type: string): Observable<T>`: Returns an observable of events of a specific type

#### Event Types

- **Group Events**:
  - `GROUP_ADDED`: Triggered when Shula is added to a WhatsApp group
  - Payload: `{ groupId, groupName, participants, timestamp }`

- **Photo Events** (planned):
  - `PHOTO_RECEIVED`: Triggered when a photo is received in a group
  - `PHOTO_PROCESSED`: Triggered when a photo has been processed
  - `FACES_RECOGNIZED`: Triggered when faces have been recognized in a photo

#### Event Listeners

- **GroupEventsListener**: Listens for group-related events and adds jobs to the appropriate queues
  - Subscribes to `GROUP_ADDED` events
  - Adds jobs to the `group-events` queue for processing

#### Queue Structure

Using BullMQ with Redis for reliable, persistent job processing:

- **group-events**: Processes group-related events
  - Processor: `handle-group-added`
  - Job data: `{ groupId, groupName, participants, timestamp }`
  
- **whatsapp-messages**: Processes incoming WhatsApp messages
  - Processor: `process-whatsapp-message`
  - Job data: `{ groupId, messageId, senderId, content, mediaUrl, timestamp }`

- **photo-processing**: Processes incoming photos
  - Processor: `process-photo`
  - Job data: `{ photoId, groupId, uploaderId, photoUrl, timestamp }`
  
- **face-recognition**: Handles face recognition tasks
  - Processor: `recognize-faces`
  - Job data: `{ photoId, processedPhotoUrl, groupId }`

- **notification**: Manages sending notifications to participants
  - Processor: `send-notification`
  - Job data: `{ photoId, processedPhotoUrl, recognizedPersonIds, participantIds, groupId }`

### 5. Face Recognition System

- **Training Phase**:
  - Process training images from participants for their children
  - Extract facial features and store as feature vectors
  - Build a searchable index of face features

- **Recognition Phase**:
  - When new photos arrive, detect all faces
  - Compare detected faces against the feature database
  - Match faces to registered persons with confidence scores
  - Trigger distribution for matches above threshold

### 6. WhatsApp Integration

Using whatsapp-web.js:

- **Connection Management**:
  - Maintain robust WebSocket connections
  - Handle QR code authentication
  - Implement reconnection strategies

- **Message Handling**:
  - Listen for incoming messages across all groups
  - Filter for image messages
  - Download and queue images for processing
  - Detect command messages for bot control

- **Message Sending**:
  - Send private messages with matched photos to participants
  - Support for text, image, and multimedia messages

### 7. Deployment Architecture

- **Docker Containers**:
  - Backend Service: NestJS application
  - WhatsApp Container: Node.js application
  - Redis: For queue management
  - PostgreSQL: For data storage
  - AWS S3: For secure photo storage

- **Amazon ECS Resources**:
  - Task Definitions: For each service container configuration
  - Services: For maintaining desired container instances
  - ECS Cluster: For container orchestration
  - Load Balancers: For traffic distribution
  - CloudWatch: For monitoring and alerts
  - Parameter Store: For configuration and secrets

### 8. Monitoring and Logging

- **Application Metrics**:
  - Queue processing rates
  - Processing success/failure rates
  - API request metrics

- **Infrastructure Metrics**:
  - Container resource usage
  - Database performance
  - WhatsApp connection health

- **Logging**:
  - Structured JSON logs
  - Log levels: ERROR, WARN, INFO, DEBUG
  - Correlation IDs across services

### 9. Security Considerations

- **Data Protection**:
  - Encryption of facial recognition data
  - Secure storage of WhatsApp session data
  - Images stored in AWS S3 with non-public access
  - Image access control managed by the backend service
  - Temporary signed URLs for authorized access to images

- **Privacy**:
  - Clear opt-in process for participants
  - Ability to delete facial recognition data
  - Compliance with relevant data protection regulations

### 10. Project Structure

Following NestJS best practices, the backend is structured as:

```
src/
├── main.ts                 # Application entry point
├── app/                    # App module
│   ├── app.module.ts       # Root module
│   ├── app.controller.ts   # Root controller
│   └── app.service.ts      # Root service
├── common/                 # Common module
│   ├── config/             # Configuration
│   │   ├── config.module.ts # Config module
│   │   └── queue.config.ts # Queue configuration
│   ├── dtos/               # Shared DTOs
│   │   ├── pagination.dto.ts # Pagination DTO
│   │   └── paginated-response.dto.ts # Paginated response DTO
│   ├── events/             # Event bus system
│   │   ├── events.module.ts # Events module
│   │   ├── event-bus.service.ts # Event bus service
│   │   ├── group.events.ts # Group event definitions
│   │   └── index.ts        # Events barrel file
│   ├── queue/              # Queue infrastructure
│   │   ├── queue.module.ts # Queue module
│   │   ├── queue.constants.ts # Queue constants
│   │   ├── base-queue.processor.ts # Base processor class
│   │   ├── base-queue.service.ts # Base service class
│   │   └── index.ts        # Queue barrel file
│   └── utils/              # Utility functions
├── database/               # Database configuration
│   └── prisma.module.ts    # Prisma module
├── modules/                # Feature modules
│   ├── groups/             # Groups module
│   │   ├── groups.module.ts # Module definition
│   │   ├── groups.controller.ts # Controller
│   │   ├── groups.service.ts # Service
│   │   ├── groups.mapper.ts # Entity-DTO mapper
│   │   ├── dto/            # Module-specific DTOs
│   │   │   ├── groups-create.dto.ts # Create DTO
│   │   │   ├── groups-update.dto.ts # Update DTO
│   │   │   ├── groups-update-status.dto.ts # Update status DTO
│   │   │   └── groups-response.dto.ts # Response DTO
│   │   └── queues/         # Queue processors and services
│   │       ├── group-events-queue.module.ts # Queue module
│   │       ├── group-events.service.ts # Queue service
│   │       ├── group-added.processor.ts # Processor
│   │       └── group-events.listener.ts # Event listener
│   ├── participants/       # Participants module
│   │   ├── participants.module.ts # Module definition
│   │   ├── participants.controller.ts # Controller
│   │   ├── participants.service.ts # Service
│   │   ├── participants.mapper.ts # Entity-DTO mapper
│   │   └── dto/            # Module-specific DTOs
│   ├── persons/            # Persons module
│   │   ├── persons.module.ts # Module definition
│   │   ├── persons.controller.ts # Controller
│   │   ├── persons.service.ts # Service
│   │   ├── persons.mapper.ts # Entity-DTO mapper
│   │   └── dto/            # Module-specific DTOs
│   ├── whatsapp/           # WhatsApp module
│   │   └── queues/         # Queue processors and services
│   │       ├── whatsapp-queue.module.ts # Queue module
│   │       ├── whatsapp-messages.service.ts # Queue service
│   │       └── whatsapp-messages.processor.ts # Processor
│   ├── photos/             # Photos module
│   │   └── queues/         # Queue processors and services
│   │       ├── photo-queue.module.ts # Queue module
│   │       ├── photo-processing.service.ts # Queue service
│   │       └── photo-processing.processor.ts # Processor
│   ├── face-recognition/   # Face recognition module
│   │   └── queues/         # Queue processors and services
│   │       ├── face-recognition-queue.module.ts # Queue module
│   │       ├── face-recognition.service.ts # Queue service
│   │       └── face-recognition.processor.ts # Processor
│   └── notifications/      # Notifications module
│       └── queues/         # Queue processors and services
│           ├── notification-queue.module.ts # Queue module
│           ├── notification.service.ts # Queue service
│           └── notification.processor.ts # Processor
└── test/                   # E2E tests
    ├── app.e2e-spec.ts     # App E2E tests
    ├── jest-e2e.json       # Jest E2E configuration
    └── groups/             # Groups E2E tests
        └── groups.e2e-spec.ts # Groups E2E tests
``` 