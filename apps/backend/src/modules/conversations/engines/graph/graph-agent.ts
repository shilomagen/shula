import { Inject, Injectable } from '@nestjs/common';
import { AzureOpenAI } from 'openai';
import { LangfuseHelper } from './langfuse-helper';

import { TextPromptClient } from 'langfuse';
import { ContextLogger } from 'nestjs-context-logger';
import { PersonInfo } from '../conversation-engine.service';
import {
  GraphContext,
  GraphResponse,
  GraphResponseType,
  NextNodeResponse,
  NodeType,
  PromptConfig,
  PromptName,
  PromptResponse,
} from './models';
import { OPENAI_CLIENT } from './providers';
import {
  MissingPromptVariablesError,
  camelToSnakeCase,
  snakeToCamelCase,
} from './utils';
import { ChatCompletionCreateParamsNonStreaming } from 'openai/resources';

/**
 * GraphAgent class for managing conversation flow
 */
@Injectable()
export class GraphAgent {
  private readonly logger = new ContextLogger(GraphAgent.name);

  /**
   * Constructor
   * @param openai - OpenAI client
   * @param langfuseHelper - Helper for Langfuse integration
   * @param promptLoader - Service for loading prompts
   */
  constructor(
    @Inject(OPENAI_CLIENT) private readonly openai: AzureOpenAI,
    private readonly langfuseHelper: LangfuseHelper
  ) {}

  /**
   * Prepare context for prompts by ensuring all required variables are present
   * @param context - The original context
   * @returns The prepared context with all required variables
   */
  private prepareContextForPrompts(context: GraphContext): Record<string, any> {
    // Extract data from the context
    const { participantId, participantName, participantContext } = context;

    // Create participant_info object
    const participantInfo = {
      id: participantId,
      name: participantName,
    };

    // Extract groups from participant context or use empty array
    const groups = participantContext?.groups || [];

    // Extract persons from all groups
    const persons: PersonInfo[] = [];
    const personToGroups: Record<string, string[]> = {};

    // Collect all persons from groups and build person-to-groups mapping
    groups.forEach((group) => {
      group.persons.forEach((person) => {
        // Add person to the persons array if not already added
        if (!persons.some((p) => p.id === person.id)) {
          persons.push({
            id: person.id,
            name: person.name,
          });
        }

        // Update person-to-groups mapping
        if (!personToGroups[person.id]) {
          personToGroups[person.id] = [];
        }
        if (!personToGroups[person.id].includes(group.id)) {
          personToGroups[person.id].push(group.id);
        }
      });
    });

    return {
      ...context,
      participant_info: participantInfo,
      groups,
      persons,
      person_to_groups: personToGroups,
    };
  }

  /**
   * Run a prompt with the given context
   * @param prompt - The prompt to run
   * @param promptsSequence - The sequence of prompts to include
   * @param context - The context to run the prompt with
   * @param jsonSchema - Optional JSON schema for structured output
   * @returns The response from the prompt
   * @throws Error if prompt compilation or execution fails
   */
  private async runPrompt<T extends PromptResponse>(
    prompt: TextPromptClient,
    promptsSequence: (TextPromptClient | null)[],
    context: Record<string, any>,
    jsonSchema?: Record<string, any>
  ): Promise<T> {
    const config = prompt.config as PromptConfig;
    this.logger.info(`Running prompt: ${config.id}`);
    this.logger.info(`Prompts sequence`, promptsSequence);
    // Filter out null prompts
    const validPrompts = promptsSequence.filter(
      (p): p is TextPromptClient => p !== null
    );
    this.logger.info(`Valid prompts`, validPrompts);
    const schema = jsonSchema || config.json_schema;

    try {
      // Prepare context with all required variables
      const preparedContext = this.prepareContextForPrompts(
        context as GraphContext
      );
      const snakeCaseContext = await camelToSnakeCase(preparedContext);
      // Combine all prompts and compile with context
      const instructions = await Promise.all(
        validPrompts.map(async (p) => {
          try {
            return this.langfuseHelper.compilePrompt(p, snakeCaseContext);
          } catch (error) {
            if (error instanceof MissingPromptVariablesError) {
              // Add more context to the error message
              throw new MissingPromptVariablesError(
                error.missingVariables,
                `${config.id} (in sequence for ${config.id})`
              );
            }
            throw error;
          }
        })
      );

      const combinedInstructions = instructions.join('\n\n');
      this.logger.info(`Instructions`, { combinedInstructions });

      const request = {
        model: config.model,
        messages: [{ role: 'system', content: combinedInstructions }],
        temperature: config.temperature,
        response_format: { type: 'json_schema', json_schema: schema as any },
      } as ChatCompletionCreateParamsNonStreaming;

      this.logger.info('OpenAI request', { request });

      const response = await this.openai.chat.completions.create(request);

      this.logger.info('OpenAI response', { response });
      const output = JSON.parse(response.choices[0]?.message?.content || '{}');

      const camelCaseOutput = await snakeToCamelCase(output);
      this.logger.info('Camel case output', { camelCaseOutput });

      if (config.type === NodeType.AGENT) {
        return {
          type: GraphResponseType.AGENT_RESPONSE,
          message: camelCaseOutput.message,
        } as T;
      }

      if (config.type === NodeType.ACTION) {
        return {
          type: GraphResponseType.ACTION_RESPONSE,
          data: camelCaseOutput,
        } as T;
      }

      if (config.type === NodeType.SYSTEM) {
        return {
          type: GraphResponseType.NEXT_NODE_RESPONSE,
          nextStep: camelCaseOutput.nextStep,
        } as T;
      }

      return camelCaseOutput;
    } catch (error: unknown) {
      if (error instanceof MissingPromptVariablesError) {
        this.logger.error(`Missing variables for prompt: ${error.message}`);
        this.logger.debug('Available context keys:', Object.keys(context));
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error running prompt: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get the next node in the conversation flow
   * @param currentNode - The current node
   * @param nextNodeLogicPrompt - The prompt for determining the next node
   * @param context - The context
   * @returns The ID of the next node
   */
  private async getNextNode(
    currentNode: TextPromptClient,
    nextNodeLogicPrompt: TextPromptClient,
    context: GraphContext
  ): Promise<string> {
    const config = currentNode.config as PromptConfig;
    const contextPrompt = await this.langfuseHelper.getPrompt(
      PromptName.CONTEXT
    );
    const nextNodesConditions = config.next_nodes_conditions;
    const nextNodesName = nextNodesConditions.map((condition) => condition.id);
    this.logger.info(`Next nodes for ${config.id}`, { nextNodesName });

    const nextNodeJsonSchema = {
      name: 'NextNodeSelection',
      description:
        'Schema for selecting the next node in the conversation flow',
      schema: {
        type: 'object',
        properties: {
          next_step: {
            type: 'string',
            enum: nextNodesName,
            description: 'The next step to select',
          },
        },
        required: ['next_step'],
      },
    };

    const nextNode = await this.runPrompt<NextNodeResponse>(
      nextNodeLogicPrompt,
      [nextNodeLogicPrompt, contextPrompt],
      {
        ...context,
        nextNodesConditions,
        currentNodeId: config.id,
        currentNodePrompt: currentNode.prompt,
      },
      nextNodeJsonSchema
    );

    this.logger.info('Next node response', { nextNode });
    return nextNode.nextStep;
  }

  /**
   * Load and validate the current node prompt
   * @param currentNodeId - The ID of the current node
   * @returns The current node prompt
   * @throws Error if the prompt is not found or not an agent/action prompt
   */
  private async loadAndValidateCurrentNode(
    currentNodeId: string
  ): Promise<TextPromptClient> {
    const currentNodePrompt = await this.langfuseHelper.getPrompt(
      currentNodeId
    );

    this.logger.info('Current node prompt', { currentNodePrompt });

    if (!currentNodePrompt) {
      throw new Error(`Prompt ${currentNodeId} not found`);
    }

    const allowedTypes = [NodeType.AGENT, NodeType.ACTION];
    const { type } = currentNodePrompt.config as PromptConfig;

    if (!allowedTypes.includes(type)) {
      throw new Error(
        `Prompt ${currentNodeId} is not an agent or action prompt`
      );
    }
    return currentNodePrompt;
  }

  /**
   * Load and validate the next node logic prompt
   * @returns The next node logic prompt
   * @throws Error if the prompt is not found or not a NextStepPrompt
   */
  private async loadAndValidateNextNodeLogic(): Promise<TextPromptClient> {
    const nextNodeLogicPrompt = await this.langfuseHelper.getPrompt(
      PromptName.NEXT_NODE_LOGIC
    );

    this.logger.debug('Next node logic prompt', { nextNodeLogicPrompt });

    if (!nextNodeLogicPrompt) {
      throw new Error(`Next node logic prompt not found`);
    }

    return nextNodeLogicPrompt;
  }

  /**
   * Check if guardrail should take over and return the guardrail node ID if needed
   * @param nextNodeId - The originally determined next node ID
   * @param nextNodeLogicPrompt - The next node logic prompt
   * @param context - The context
   * @returns The guardrail node ID if guardrail should take over, null otherwise
   */
  private async checkGuardrail(
    nextNodeId: string,
    nextNodeLogicPrompt: TextPromptClient,
    context: GraphContext
  ): Promise<string | null> {
    if (nextNodeId.includes('escalation')) {
      return null;
    }
    const guardNodePrompt = await this.langfuseHelper.getPrompt(
      PromptName.GUARDRAIL
    );
    if (!guardNodePrompt) {
      return null;
    }
    this.logger.debug('Running guardrail');

    const guardNextNodeId = await this.getNextNode(
      guardNodePrompt,
      nextNodeLogicPrompt,
      context
    );

    if (guardNextNodeId === 'continue with steps') {
      return null;
    }

    this.logger.debug(`Guardrail takes over, move to ${guardNextNodeId}`);
    return guardNextNodeId;
  }

  /**
   * Execute a node with the given context
   * @param nodeId - The ID of the node to execute
   * @param context - The context
   * @returns The response from the executed node
   */
  private async executeNode(
    nodeId: string,
    context: GraphContext
  ): Promise<GraphResponse> {
    const [nodePrompt, guidelinePrompt, knowledgePrompt, contextPrompt] =
      await Promise.all([
        this.langfuseHelper.getPrompt(nodeId),
        this.langfuseHelper.getPrompt(PromptName.GUIDELINES),
        this.langfuseHelper.getPrompt(PromptName.KNOWLEDGE),
        this.langfuseHelper.getPrompt(PromptName.CONTEXT),
      ]);

    if (!nodePrompt) {
      throw new Error(`Prompt ${nodeId} not found`);
    }

    const response = await this.runPrompt(
      nodePrompt,
      [guidelinePrompt, nodePrompt, knowledgePrompt, contextPrompt],
      context
    );

    return {
      ...response,
      metadata: {
        currentNode: nodeId,
      },
    } as GraphResponse;
  }

  /**
   * Run the conversation graph
   * @param context - The context for the conversation
   * @returns The response from the executed node
   */
  async runGraph(context: GraphContext): Promise<GraphResponse> {
    try {
      this.logger.debug('Original context keys:', Object.keys(context));

      const currentNode = await this.loadAndValidateCurrentNode(
        context.currentNode
      );

      const nextNodeLogic = await this.loadAndValidateNextNodeLogic();

      const nextNodeId = await this.getNextNode(
        currentNode,
        nextNodeLogic,
        context
      );

      // Check if guardrail should take over
      const guardrailNodeId = await this.checkGuardrail(
        nextNodeId,
        nextNodeLogic,
        context
      );

      const nodeToExecute = guardrailNodeId || nextNodeId;
      return await this.executeNode(nodeToExecute, context);
    } catch (error: unknown) {
      if (error instanceof MissingPromptVariablesError) {
        this.logger.error(`Missing prompt variables: ${error.message}`);
        return {
          type: GraphResponseType.AGENT_RESPONSE,
          message:
            'I apologize, but I cannot process your request at this time. Please try again later or contact support if the issue persists.',
          metadata: {
            error: 'missing_variables',
            missingVariables: error.missingVariables,
            currentNode: context.currentNode,
          },
        };
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error running graph: ${errorMessage}`);

      // Return a default response in case of error
      return {
        type: GraphResponseType.AGENT_RESPONSE,
        message:
          'Sorry, I encountered an error while processing your message. Please try again later.',
        metadata: {
          currentNode: context.currentNode,
          error: 'graph_execution_error',
          errorMessage,
        },
      };
    }
  }
}
