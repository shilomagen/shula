import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';

export const ParticipantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const participantId = request.headers['x-participant-id'];

    if (typeof participantId !== 'string') {
      throw new Error('Participant ID header must be a string');
    }

    return participantId;
  }
);

/**
 * Decorator to add the x-participant-id header to Swagger documentation
 */
export const ApiParticipantId = () =>
  ApiHeader({
    name: 'x-participant-id',
    description: 'Unique identifier for the participant',
    required: true,
  });
