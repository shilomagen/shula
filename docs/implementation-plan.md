# Shula - Implementation Plan

## Phase 1: Foundation Setup

### 1.1 Project Setup and Infrastructure (Week 1)

- [x] Initialize NX workspace
- [x] Create backend and whatsapp-container apps
- [x] Set up Docker Compose for local development
- [x] Configure PostgreSQL database
- [x] Set up Redis for queue management
- [ ] Configure AWS S3 for image storage
- [x] Configure shared libraries and types
- [ ] Implement CI/CD pipeline

### 1.2 Core Backend Implementation (Weeks 2-3)

- [x] Set up NestJS project structure with modules
  - [x] Create common module for shared functionality
  - [x] Set up feature modules (groups, participants, persons, photos)
  - [ ] Configure global exception filters and interceptors
- [x] Implement domain entities and database schema
- [x] Create DTOs for requests and responses
  - [x] Implement validation using class-validator
  - [x] Create entity-to-DTO mappers
- [x] Implement REST API endpoints following REST principles
  - [x] Configure API versioning
  - [x] Implement consistent response formats
  - [x] Set up Swagger documentation
- [x] Set up queue consumers and producers
  - [x] Implement BullMQ integration with Redis
  - [x] Create base queue service and processor classes
  - [x] Implement queue modules for different domains
- [x] Implement event-driven architecture
  - [x] Create event bus service using RxJS
  - [x] Define event types and payloads
  - [x] Implement event listeners
  - [x] Connect events to queue processors
- [ ] Implement S3 integration for image storage
- [ ] Implement basic authentication and authorization
- [ ] Write unit and integration tests using the driver pattern

### 1.3 WhatsApp Container Implementation (Weeks 2-3)

- [ ] Set up whatsapp-web.js integration
- [ ] Implement connection management
- [ ] Implement group detection and creation
- [ ] Set up message listeners
- [ ] Implement queue producers
- [ ] Implement queue consumers for outbound messages
- [ ] Create reconnection strategies
- [ ] Implement group activation/deactivation mechanism
- [ ] Write unit and integration tests

## Phase 2: Face Recognition Implementation

### 2.1 Face Detection and Feature Extraction (Weeks 4-5)

- [ ] Research and select face recognition library/service
- [ ] Implement face detection from images
- [ ] Implement feature extraction from faces
- [ ] Create training workflow for new person registration
- [ ] Implement feature storage and indexing
- [ ] Develop quality assessment for face data
- [ ] Write unit and integration tests

### 2.2 Recognition and Matching (Weeks 5-6)

- [ ] Implement face matching algorithm
- [ ] Create confidence scoring system
- [ ] Set up threshold-based match filtering
- [ ] Optimize for performance and resource usage
- [ ] Develop fallback mechanisms for uncertain matches
- [ ] Write unit and integration tests

## Phase 3: Image Processing and Distribution

### 3.1 Photo Processing Pipeline (Week 7)

- [ ] Implement photo storage system with S3
- [ ] Create photo metadata tracking
- [ ] Set up processing queue workflow
- [ ] Implement parallel processing for batch uploads
- [ ] Develop error handling and retry mechanisms
- [ ] Write unit and integration tests

### 3.2 Photo Distribution System (Week 8)

- [ ] Implement matching algorithm to pair photos with participants
- [ ] Create distribution queue workflow
- [ ] Set up private messaging system
- [ ] Implement batch processing for efficiency
- [ ] Develop distribution tracking and analytics
- [ ] Write unit and integration tests

## Phase 4: User Experience and Commands

### 4.1 Bot Commands (Week 9)

- [ ] Design command syntax and structure
- [ ] Implement command parsing
- [ ] Create command handlers
- [ ] Implement group activation/deactivation commands
- [ ] Set up help and documentation system
- [ ] Implement administrative commands
- [ ] Write unit and integration tests

### 4.2 Onboarding Flow (Week 10)

- [ ] Design participant onboarding experience
- [ ] Create guided onboarding flow
- [ ] Implement automated group and participant registration
- [ ] Implement person registration process
- [ ] Set up face data collection interface
- [ ] Develop verification mechanism
- [ ] Write unit and integration tests

## Phase 5: Optimization and Scaling

### 5.1 Performance Optimization (Week 11)

- [ ] Conduct load testing
- [ ] Optimize critical code paths
- [ ] Implement caching strategies
- [ ] Optimize database queries
- [ ] Fine-tune queue processing
- [ ] Assess resource requirements

### 5.2 Scaling and Reliability (Week 12)

- [ ] Configure ECS services for horizontal scaling
- [ ] Set up CloudWatch monitoring and alerting
- [ ] Create automatic recovery mechanisms
- [ ] Develop backup and restore procedures
- [ ] Implement rate limiting
- [ ] Conduct failover testing

## Data Flow Diagrams

### 1. Group Setup and Onboarding Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  WhatsApp   │     │  WhatsApp   │     │   Backend   │
│   Group     │────▶│  Container  │────▶│   Service   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │                                       ▼
       │                               ┌─────────────┐
       │                               │  Group &    │
       │                               │ Participant │
       │                               │ Registration│
       │                               └─────────────┘
       │                                       │
       │                                       ▼
       │                               ┌─────────────┐
       ▼                               │  Admin      │
┌─────────────┐                        │ Activation  │
│  Participant│◀───────────────────────└─────────────┘
└─────────────┘                                │
       │                                       ▼
       │                               ┌─────────────┐
       ├──────────────────────────────▶│Face Feature │
       │       Registration            │ Extraction  │
       │                               └─────────────┘
       │                                       │
       │                                       ▼
       │                                ┌─────────────┐
       │                                │Feature Store│
       │                                └─────────────┘
```

### 2. Photo Processing Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  WhatsApp   │     │  WhatsApp   │     │   Photo     │
│   Group     │────▶│  Container  │────▶│ Processing  │
└─────────────┘     └─────────────┘     │   Queue     │
                                         └─────────────┘
                                                │
                                                ▼
                                        ┌─────────────┐
                                        │   Backend   │
                                        │   Service   │
                                        └─────────────┘
                                                │
                                                ▼
                                        ┌─────────────┐
                                        │Face Detection│
                                        │ and Matching │
                                        └─────────────┘
                                                │
                                                ▼
                                        ┌─────────────┐
                                        │   Matched   │
                                        │  Results    │
                                        └─────────────┘
                                                │
                                                ▼
                                        ┌─────────────┐
                                        │Distribution │
                                        │   Queue     │
                                        └─────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Participant │◀────│  WhatsApp   │◀────│   Image     │
│             │     │  Container  │     │  Delivery   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Backend Project Structure

```
apps/backend/src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── common/                 # Common module
│   ├── config/             # Configuration
│   ├── decorators/         # Custom decorators
│   ├── dtos/               # Shared DTOs
│   ├── filters/            # Exception filters
│   ├── guards/             # Guards
│   ├── interceptors/       # Interceptors
│   ├── middlewares/        # Middlewares
│   ├── services/           # Shared services
│   ├── types/              # Shared types
│   └── utils/              # Utility functions
├── modules/                # Feature modules
│   ├── groups/             # Groups module
│   │   ├── controllers/    # Controllers
│   │   ├── dtos/           # Module-specific DTOs
│   │   │   ├── request/    # Request DTOs
│   │   │   └── response/   # Response DTOs
│   │   ├── entities/       # Database entities
│   │   ├── mappers/        # Entity-DTO mappers
│   │   ├── services/       # Services
│   │   ├── repositories/   # Repositories
│   │   ├── groups.module.ts # Module definition
│   │   └── tests/          # Tests
│   ├── participants/       # Participants module
│   ├── persons/            # Persons module
│   ├── photos/             # Photos module
│   └── face-recognition/   # Face recognition module
└── database/               # Database configuration
```

## Milestones and Deliverables

### Milestone 1: Project Setup (End of Week 1)
- Working local development environment
- Database and queue infrastructure
- Project structure and shared libraries

### Milestone 2: Core Functionality (End of Week 3)
- Basic backend API with proper REST design
- WhatsApp integration
- Queue system for communication
- Entity management with DTOs and validation
- Swagger documentation

### Milestone 3: Face Recognition System (End of Week 6)
- Working face detection
- Feature extraction
- Person matching algorithm
- Training workflow

### Milestone 4: Photo Processing (End of Week 8)
- Complete photo processing pipeline
- Photo distribution system
- End-to-end workflow for simple cases

### Milestone 5: Full System (End of Week 10)
- Bot commands
- Onboarding flow
- Administrative functions
- User experience enhancements

### Milestone 6: Production-Ready System (End of Week 12)
- Performance optimizations
- Scaling capabilities
- Monitoring and alerting
- Production deployment 