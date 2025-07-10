# Graph-based Conversation Engine

This is a TypeScript implementation of a graph-based conversation engine, inspired by a Python implementation. The engine uses a graph-based approach to manage conversation flow, with nodes representing different states in the conversation.

## Architecture

The engine consists of the following components:

### Data Models

- `GraphContext`: Contains the conversation context, including messages, participant information, and the current node.
- `BasePrompt`: Base interface for all prompts.
- `AgentPrompt`: Interface for regular conversation nodes.
- `ActionPrompt`: Interface for nodes that perform actions.
- `NextStepPrompt`: Interface for determining the next node in the flow.

### Core Components

- `GraphAgent`: The main class that orchestrates the conversation flow.
- `LangfuseHelper`: Helper class for Langfuse integration.
- `ContextConverter`: Utility class for converting between different context formats.

### Providers

- `OpenAIProvider`: Provider for the OpenAI client.
- `LangfuseProvider`: Provider for the Langfuse client.

### Service Implementation

- `GraphOpenAIConversationEngineService`: Implementation of the `ConversationEngineInterface` that uses the graph-based approach.

## Flow

1. The service receives a request to generate a response.
2. The request parameters are converted to a `GraphContext`.
3. The `GraphAgent` loads the current node prompt from Langfuse.
4. The agent determines the next node in the conversation flow.
5. The agent runs guardrail checks and handles any required flow changes.
6. The agent executes the appropriate node with all context prompts.
7. The response is extracted and returned.

## Configuration

The engine requires the following environment variables:

- `OPENAI_API_KEY`: API key for OpenAI.
- `LANGFUSE_SECRET_KEY`: Secret key for Langfuse.
- `LANGFUSE_PUBLIC_KEY`: Public key for Langfuse.
- `LANGFUSE_BASEURL`: Base URL for Langfuse API.

## Usage

To use the graph-based conversation engine, import the `GraphConversationsModule` instead of the regular `ConversationsModule`:

```typescript
import { Module } from '@nestjs/common';
import { GraphConversationsModule } from './modules/conversations/graph-conversations.module';

@Module({
  imports: [
    GraphConversationsModule,
    // other modules...
  ],
})
export class AppModule {}
```

## Prompts

The engine uses the following prompts from Langfuse:

- `dissambiguate_intent`: The starting node for the conversation.
- `guidelines`: Guidelines for the conversation.
- `guardrail`: Guardrail checks for the conversation.
- `knowledge`: Knowledge base for the conversation.
- `context`: Context for the conversation.
- `next_node_logic`: Logic for determining the next node.

These prompts should be defined in Langfuse with the appropriate JSON schemas and configurations. 