import { ConversationMetadata } from '../../conversations.service';
import { MessageUnion } from '../../types/message.types';
import { ParticipantContext } from '../../../participants/participants.types';
import { ConnectPersonAction } from './actions/connect-person';
import { RemovePersonAction } from './actions/remove-person';

interface NextNodeCondition {
  id: string;
  condition: string;
}

export interface PromptConfig {
  id: string;
  type: NodeType;
  model: string;
  temperature: number;
  json_schema: any;
  description: string;
  next_nodes_conditions: NextNodeCondition[];
  next_nodes_name: string[];
}

/**
 * Enum for node types in the conversation graph
 */
export enum NodeType {
  AGENT = 'agent',
  ACTION = 'action',
  STATIC = 'static',
  SYSTEM = 'system',
}

/**
 * Enum for prompt names
 */
export enum PromptName {
  START_NODE = 'dissambiguate_intent',
  GUIDELINES = 'guidelines',
  GUARDRAIL = 'guardrail',
  KNOWLEDGE = 'knowledge',
  CONTEXT = 'context',
  NEXT_NODE_LOGIC = 'next_node_logic',
}

/**
 * Chat message model
 */
export interface ChatMessage {
  role: string;
  content: string;
}

/**
 * Graph context model
 */
export interface GraphContext {
  participantId: string;
  participantName: string;
  participantContext: ParticipantContext;
  conversationId: string;
  currentNode: string;
  message: string;
  messages: MessageUnion[];
  metadata: ConversationMetadata;
}

export enum GraphResponseType {
  AGENT_RESPONSE = 'agent_response',
  ACTION_RESPONSE = 'action_response',
  NEXT_NODE_RESPONSE = 'next_node_response',
}

/**
 * Response models
 */
export interface ActionResponse {
  type: GraphResponseType.ACTION_RESPONSE;
  data: ConnectPersonAction | RemovePersonAction;
  metadata?: Record<string, any>;
  currentNode?: string;
}

export interface AgentResponse {
  type: GraphResponseType.AGENT_RESPONSE;
  message: string;
  metadata?: Record<string, any>;
  currentNode?: string;
}

export interface NextNodeResponse {
  type: GraphResponseType.NEXT_NODE_RESPONSE;
  nextStep: string;
}

export type PromptResponse = AgentResponse | ActionResponse | NextNodeResponse;
export type GraphResponse = AgentResponse | ActionResponse;
