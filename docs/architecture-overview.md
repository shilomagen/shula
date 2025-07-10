# Shula - WhatsApp Photo Dispatch Bot

## Overview

Shula is a specialized WhatsApp bot designed to intelligently distribute photos within WhatsApp groups based on face recognition. The primary use case is for groups where multiple photos are shared (such as school or activity groups), and Shula ensures that parents only receive photos containing their children.

## Key Features

- **Automated Photo Distribution**: Analyzes shared photos and routes them to the appropriate participants
- **Face Recognition**: Uses facial recognition to identify individuals in photos
- **Multi-Group Support**: Can operate simultaneously in hundreds of WhatsApp groups
- **Multi-Child Support**: Parents can register multiple children for recognition
- **Secure & Privacy-Focused**: Only authorized participants receive images

## High-Level Architecture

Shula is built as a microservices architecture using NX workspace and NestJS for the backend services. The system consists of two main services:

### 1. Backend Service (`apps/backend`)

The core processing engine that handles:
- User management (participants, children, groups)
- Face recognition processing
- API endpoints for system management
- Database operations
- Authentication and authorization
- Image processing and storage

#### NestJS Architecture

The backend follows NestJS best practices with a modular architecture:

- **Common Module**: Shared functionality across the application
  - Configuration management
  - Custom decorators
  - Exception filters
  - Guards and interceptors
  - Shared services and utilities
  - Event bus for decoupled communication between modules

- **Feature Modules**: Domain-specific functionality
  - Groups module
  - Participants module
  - Persons module
  - Photos module
  - Face Recognition module

- **API Design**:
  - RESTful endpoints with resource-oriented URLs
  - Versioned API (e.g., `/api/v1/resources`)
  - Consistent response formats
  - Comprehensive Swagger documentation
  - Proper HTTP status codes

- **Data Layer**:
  - Clear separation between entities and DTOs
  - Entity-to-DTO mappers
  - Request validation using class-validator
  - Prisma for database operations

### 2. WhatsApp Container Service (`apps/whatsapp-container`)

A stateless service that:
- Maintains WhatsApp connections using whatsapp-web.js
- Listens to incoming messages across all WhatsApp groups
- Forwards relevant messages to the backend for processing
- Delivers processed photos to participants
- Ensures high availability with resilient connections

### Communication Pattern

The system uses a hybrid communication approach combining event-driven architecture with queue-based processing:

#### Event-Driven Architecture
- **Event Bus**: A central event bus facilitates decoupled communication between modules
- **Event Publishers**: Modules publish domain events when significant state changes occur
- **Event Listeners**: Modules subscribe to relevant events and react accordingly
- **Decoupled Modules**: Reduces circular dependencies and improves maintainability

#### Queue-Based Processing
- **BullMQ Queues**: Reliable, persistent job queues backed by Redis
- **Job Processors**: Specialized workers that handle specific types of jobs
- **Asynchronous Processing**: Long-running tasks are processed asynchronously

The communication flow typically follows this pattern:
1. API endpoints or event listeners trigger domain events
2. Event listeners process these events and may add jobs to appropriate queues
3. Queue processors handle the jobs asynchronously
4. Results may trigger additional events to notify other parts of the system

## Scalability Considerations

- **Backend Horizontal Scaling**: The backend service can be scaled horizontally to handle increased load
- **WhatsApp Container Constraints**: The WhatsApp container service cannot be scaled horizontally as it maintains a direct connection to WhatsApp Web through whatsapp-web.js. Each instance must maintain its own unique WhatsApp session.
- **Queue-Based Architecture**: Ensures message processing resilience
- **Event-Driven Design**: Improves system responsiveness and scalability
- **Load Distribution**: Multiple WhatsApp containers can be deployed to handle different groups of WhatsApp connections, though each container manages its own distinct set of groups

## Data Flow

1. **Group Setup Flow**:
   - Shula is added to a WhatsApp group by an administrator
   - A `GROUP_ADDED` event is published to the event bus
   - Event listeners process this event and add a job to the group events queue
   - The group events processor creates the group in the database and registers all existing participants
   - Shula is disabled by default and requires manual activation for each group
   - An authorized administrator activates Shula for the group through a command

2. **Onboarding Flow**:
   - Parents are already members of their respective WhatsApp groups
   - After Shula is activated in a group, parents can register their children
   - Parent sends sample photos of their child to Shula for registration
   - System processes and stores facial features for recognition

3. **Photo Distribution Flow**:
   - Bulk photos are shared in a WhatsApp group
   - A photo event is published to the event bus
   - Photo processing jobs are added to the photo processing queue
   - Face recognition jobs are added to the face recognition queue
   - Notification jobs are added to the notification queue
   - Photos are sent privately to corresponding parents

## Technical Stack

- **Framework**: NestJS (Node.js)
- **Monorepo Management**: NX Workspace
- **WhatsApp Integration**: whatsapp-web.js
- **Queue System**: BullMQ with Redis
- **Event Bus**: Custom implementation using RxJS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator and class-transformer
- **Face Recognition**: TBD (Consider TensorFlow.js, AWS Rekognition, or similar)
- **Image Processing**: Sharp or similar Node.js library
- **Containerization**: Docker
- **Orchestration**: Amazon ECS (Elastic Container Service) 