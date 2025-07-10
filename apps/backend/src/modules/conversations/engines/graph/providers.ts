import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Langfuse } from 'langfuse';
import OpenAI, { AzureOpenAI } from 'openai';

/**
 * Provider token for OpenAI client
 */
export const OPENAI_CLIENT = 'OPENAI_CLIENT';

/**
 * Provider token for Langfuse client
 */
export const LANGFUSE_CLIENT = 'LANGFUSE_CLIENT';

/**
 * Provider for OpenAI client
 */
export const OpenAIProvider: Provider = {
  provide: OPENAI_CLIENT,
  useFactory: (configService: ConfigService) => {
    const apiKey = configService.get<string>('AZURE_OPENAI_API_KEY');
    const endpoint = configService.get<string>('OPENAI_ENDPOINT');
    if (!apiKey || !endpoint) {
      throw new Error(
        'OPENAI_API_KEY or OPENAI_ENDPOINT is not defined in environment variables'
      );
    }
    return new AzureOpenAI({
      apiKey,
      endpoint,
      apiVersion: '2024-08-01-preview',
    });
  },
  inject: [ConfigService],
};
/**
 * Provider for Langfuse client
 */
export const LangfuseProvider: Provider = {
  provide: LANGFUSE_CLIENT,
  useFactory: (configService: ConfigService) => {
    const secretKey = configService.get<string>('LANGFUSE_SECRET_KEY');
    const publicKey = configService.get<string>('LANGFUSE_PUBLIC_KEY');
    const baseUrl = configService.get<string>('LANGFUSE_BASEURL');

    return new Langfuse({
      secretKey,
      publicKey,
      baseUrl,
      enabled: !!secretKey && !!publicKey,
    });
  },
  inject: [ConfigService],
};
