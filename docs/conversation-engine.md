# Conversation Engine

This document explains how Shula handles user conversations using the graph-based conversation engine. The engine powers onboarding flows such as connecting a person to a participant.

## Overview

- **ConversationEngineService** orchestrates interactions for each participant.
- **GraphAgent** evaluates the current node and determines the next step using prompts stored in Langfuse.
- **Action Handlers** execute backend actions when the graph output specifies an action.

## Flow

1. When a message arrives, `ConversationEngineService.generateResponse` assembles a `GraphContext` containing the participant info, conversation history and metadata.
2. The service calls `GraphAgent.runGraph(context)` which loads the current node prompt, decides the next node and executes it.
3. `GraphAgent` may return either an agent response (text for the user) or an action description. If an action is returned the `ActionRegistryService` invokes the matching handler from `apps/backend/src/modules/conversations/engines/graph/handlers`.
4. The handler performs domain logic and returns a result which is then sent back to the participant as a message.

### Connect Person Flow

The `ConnectPersonActionHandler` is used to register a new person for a participant. It performs the following steps:

1. A new `Person` record is created in the database.
2. The uploaded training images are downloaded from S3 and converted to base64.
3. The images are indexed with AWS Rekognition and associated with a **user** whose id equals the `Person` id.
4. After indexing the photos are removed from the temporary S3 bucket so no training images are persisted.

See `apps/backend/src/modules/conversations/engines/graph/handlers/connect-person.handler.ts` for the implementation.

### Person Deletion

When a participant deletes a person, `PersonsService` queues a deletion flow. The flow removes the Rekognition user and all associated faces via `PersonSideEffectsFlowService` and finally deletes the database record. See `apps/backend/src/modules/persons` for details.

