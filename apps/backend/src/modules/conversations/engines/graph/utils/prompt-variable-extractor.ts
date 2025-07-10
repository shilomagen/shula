import { ContextLogger } from 'nestjs-context-logger';

/**
 * Custom exception for missing prompt variables
 */
export class MissingPromptVariablesError extends Error {
  constructor(
    public readonly missingVariables: string[],
    public readonly promptId?: string
  ) {
    super(
      `Missing required variables for prompt${
        promptId ? ` "${promptId}"` : ''
      }: ${missingVariables.join(', ')}`
    );
    this.name = 'MissingPromptVariablesError';
  }
}

/**
 * Extracts variable names from a prompt string
 * @param promptText - The prompt text to extract variables from
 * @returns Array of variable names
 */
export function extractPromptVariables(promptText: string): string[] {
  const variableRegex = /\{\{([A-Za-z0-9_]+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variableRegex.exec(promptText)) !== null) {
    variables.push(match[1]);
  }

  // Return unique variables
  return [...new Set(variables)];
}

/**
 * Validates that all required variables are present in the context
 * @param requiredVariables - Array of required variable names
 * @param context - The context object containing variable values
 * @returns Object with validation result and missing variables
 */
export function validatePromptVariables(
  requiredVariables: string[],
  context: Record<string, any>
): { isValid: boolean; missingVariables: string[] } {
  const contextKeys = Object.keys(context);
  const missingVariables = requiredVariables.filter(
    (variable) => !contextKeys.includes(variable) || context[variable] === ''
  );

  return {
    isValid: missingVariables.length === 0,
    missingVariables,
  };
}

/**
 * Validates and logs prompt variables
 * @param promptText - The prompt text to validate
 * @param context - The context object containing variable values
 * @param logger - Logger instance
 * @param promptId - Optional prompt ID for better error messages
 * @throws MissingPromptVariablesError if required variables are missing
 */
export function validateAndLogPromptVariables(
  promptText: string,
  context: Record<string, any>,
  logger: ContextLogger,
  promptId?: string
): void {
  const requiredVariables = extractPromptVariables(promptText);

  if (requiredVariables.length > 0) {
    logger.debug(
      `Required variables for prompt${
        promptId ? ` "${promptId}"` : ''
      }: ${requiredVariables.join(', ')}`
    );

    // Log the first few characters of each variable's value for debugging
    const variableValues = requiredVariables.reduce((acc, variable) => {
      if (variable in context) {
        const value = context[variable];
        const preview =
          typeof value === 'string'
            ? value.length > 50
              ? `${value.substring(0, 50)}...`
              : value
            : String(value);
        acc[variable] = preview;
      } else {
        acc[variable] = 'MISSING';
      }
      return acc;
    }, {} as Record<string, string>);

    logger.debug('Variable values preview:', variableValues);
  }

  const { isValid, missingVariables } = validatePromptVariables(
    requiredVariables,
    context
  );

  if (!isValid) {
    logger.error(`Missing variables: ${missingVariables.join(', ')}`);
    logger.debug('Available context keys:', Object.keys(context));
    throw new MissingPromptVariablesError(missingVariables, promptId);
  }
}
