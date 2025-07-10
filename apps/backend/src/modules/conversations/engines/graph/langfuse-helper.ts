import { Inject, Injectable } from '@nestjs/common';
import { Langfuse } from 'langfuse';
import { TextPromptClient } from 'langfuse-core';
import { ContextLogger } from 'nestjs-context-logger';
import { LANGFUSE_CLIENT } from './providers';
import { validateAndLogPromptVariables } from './utils';

/**
 * Helper class for Langfuse integration
 */
@Injectable()
export class LangfuseHelper {
  private readonly logger = new ContextLogger(LangfuseHelper.name);

  /**
   * Constructor
   * @param langfuse - Langfuse client
   */
  constructor(@Inject(LANGFUSE_CLIENT) private readonly langfuse: Langfuse) {}

  /**
   * Get a prompt from Langfuse
   * @param promptName - The name of the prompt to get
   * @returns The prompt
   */
  async getPrompt(promptName: string): Promise<TextPromptClient | null> {
    try {
      this.logger.debug(`Getting prompt from Langfuse: ${promptName}`);
      return this.langfuse.getPrompt(promptName);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error getting prompt from Langfuse: ${errorMessage}`);
      return null;
    }
  }

  /**
   * Stringify a value for prompt compilation
   * @param value - The value to stringify
   * @returns The stringified value
   */
  private stringifyValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value) || typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch (error) {
        this.logger.warn(`Failed to stringify value: ${error}`);
        return String(value);
      }
    }

    return String(value);
  }

  /**
   * Prepare context by stringifying all values
   * @param context - The original context object
   * @returns A new context object with stringified values
   */
  private prepareContext(context: Record<string, any>): Record<string, string> {
    const stringifiedContext: Record<string, string> = {};

    for (const key in context) {
      if (Object.prototype.hasOwnProperty.call(context, key)) {
        stringifiedContext[key] = this.stringifyValue(context[key]);
      }
    }

    this.logger.debug('Context prepared with stringified values');
    return stringifiedContext;
  }

  /**
   * Compile a prompt with context
   * @param prompt - The prompt to compile
   * @param context - The context to compile the prompt with (should be in snake_case)
   * @returns The compiled prompt
   * @throws MissingPromptVariablesError if required variables are missing
   */
  compilePrompt(
    prompt: TextPromptClient,
    context: Record<string, any>
  ): string {
    try {
      // Log available context keys for debugging
      this.logger.debug(
        'Available context keys for prompt compilation:',
        Object.keys(context)
      );

      // Prepare context by stringifying all values
      const stringifiedContext = this.prepareContext(context);

      // Extract and validate variables before compilation
      validateAndLogPromptVariables(
        prompt.prompt as string,
        stringifiedContext,
        this.logger,
        prompt.name
      );

      // Compile the prompt with the validated context
      return prompt.compile(stringifiedContext);
    } catch (error: unknown) {
      // Re-throw MissingPromptVariablesError, which will be caught by the caller
      if (error instanceof Error) {
        this.logger.error(`Error compiling prompt: ${error.message}`);
        throw error;
      }

      // For other errors, throw a generic error
      const errorMessage =
        typeof error === 'string' ? error : 'Unknown error compiling prompt';
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Shutdown the Langfuse client
   */
  async shutdown(): Promise<void> {
    try {
      await this.langfuse.shutdown();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error shutting down Langfuse: ${errorMessage}`);
    }
  }
}
