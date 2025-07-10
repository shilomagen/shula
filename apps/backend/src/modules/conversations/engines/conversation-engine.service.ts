import { Injectable } from '@nestjs/common';
import { ContextLogger } from 'nestjs-context-logger';
import { match } from 'ts-pattern';
import { ParticipantContext } from '../../participants/participants.types';
import { ConversationMetadata } from '../conversations.service';
import { MessageUnion } from '../types/message.types';
import { GraphAgent } from './graph/graph-agent';
import { ActionRegistryService } from './graph/handlers/action-registry.service';
import { GraphContext, GraphResponseType } from './graph/models';

/**
 * Response from the conversation engine
 */
export interface ConversationEngineResponse {
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * Parameters for generating a response
 */
export interface GenerateResponseParams {
  /**
   * The participant ID
   */
  readonly participantId: string;

  /**
   * The participant's name
   */
  readonly participantName: string;

  /**
   * The current message content
   */
  readonly message: string;

  /**
   * The conversation history
   */
  readonly conversationHistory: MessageUnion[];

  /**
   * The participant's context (groups and related persons)
   */
  readonly participantContext: ParticipantContext;

  /**
   * The current node in the conversation flow
   */
  readonly currentNode?: string;

  /**
   * The conversation ID
   */
  readonly conversationId: string;

  /**
   * Optional metadata for the conversation
   */
  readonly metadata?: Record<string, any>;

  /**
   * Optional callback for updating conversation
   * The payload can include metadata, currentNode, and other fields
   */
  onConversationUpdate?: (payload: {
    metadata?: Record<string, any>;
    currentNode?: string;
    status?: any;
  }) => void;
}

/**
 * Information about a person
 */
export interface PersonInfo {
  /**
   * The person ID
   */
  readonly id: string;

  /**
   * The person's name
   */
  readonly name: string;
}

/**
 * Graph-based conversation engine implementation
 */
@Injectable()
export class ConversationEngineService {
  private readonly logger = new ContextLogger(ConversationEngineService.name);

  constructor(
    private readonly graphAgent: GraphAgent,
    private readonly actionRegistry: ActionRegistryService
  ) {}

  /**
   * Generate a response to a user message
   */
  async generateResponse(
    params: GenerateResponseParams
  ): Promise<ConversationEngineResponse> {
    const {
      participantId,
      message,
      conversationId,
      conversationHistory,
      metadata,
      currentNode,
    } = params;

    try {
      this.logger.info('Generating response', {
        participantId,
        conversationId,
        messageLength: message.length,
        historyLength: conversationHistory.length,
        currentNode,
      });

      // Convert GenerateResponseParams to GraphContext
      const graphContext: GraphContext = {
        participantId,
        participantName: params.participantName,
        participantContext: params.participantContext,
        conversationId,
        currentNode: currentNode || '',
        message,
        messages: conversationHistory,
        metadata: {
          ...metadata,
        },
      };

      // Use the graph agent to generate a response
      const graphResponse = await this.graphAgent.runGraph(graphContext);

      // Extract the response content and metadata
      const data = await match(graphResponse)
        .with({ type: GraphResponseType.AGENT_RESPONSE }, (response) => {
          this.logger.info('Agent response', response);
          return {
            content: response.message,
            metadata: response.metadata || {},
            currentNode: response.currentNode || currentNode,
          };
        })
        .with({ type: GraphResponseType.ACTION_RESPONSE }, async (response) => {
          this.logger.info('Action response', response);
          // Execute the action using the action registry
          const result = await this.actionRegistry.executeAction(
            response.data,
            params.participantId
          );
          this.logger.info('Action result', result);
          return {
            content: result.message,
            metadata: {
              action: response.data,
              actionResult: result,
            },
            currentNode: response.currentNode || currentNode,
          };
        })
        .otherwise((response) => {
          this.logger.info('Unknown response', response);
          return {
            content: 'Unknown response',
            metadata: {},
            currentNode,
          };
        });

      const updatePayload: {
        metadata?: Record<string, any>;
        currentNode?: string;
      } = {};

      if (data.metadata && Object.keys(data.metadata).length > 0) {
        updatePayload.metadata = data.metadata;
      }

      if (data.currentNode && data.currentNode !== currentNode) {
        updatePayload.currentNode = data.currentNode;

        // Also include currentNode in metadata for backward compatibility
        if (!updatePayload.metadata) {
          updatePayload.metadata = {};
        }
        updatePayload.metadata.currentNode = data.currentNode;
      }

      if (
        (updatePayload.metadata || updatePayload.currentNode) &&
        params.onConversationUpdate
      ) {
        await params.onConversationUpdate(updatePayload);
      }

      return {
        content: data.content,
        metadata: data.metadata,
      };
    } catch (error: any) {
      this.logger.error('Error generating response', { error });

      return {
        content:
          'Sorry, I encountered an error while processing your message. Please try again later.',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}
