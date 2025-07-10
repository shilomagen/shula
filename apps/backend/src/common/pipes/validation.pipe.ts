import {
  ValidationPipe as NestValidationPipe,
  ValidationError,
  BadRequestException,
} from '@nestjs/common';

export const ValidationPipe = new NestValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  transformOptions: {
    enableImplicitConversion: false,
  },
  exceptionFactory: (validationErrors: ValidationError[] = []) => {
    const errors = validationErrors.map((error) => {
      return Object.values(error.constraints || {}).join(', ');
    });

    return new BadRequestException(errors);
  },
});
