import './tracing';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as bodyParser from 'body-parser';
import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // Create the app with buffered logs
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Buffer logs until logger is ready
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['/health'],
  });

  if (process.env.NODE_ENV !== 'production') {
    app.enableCors({
      origin: ['http://localhost:3200'],
      credentials: true,
    });
  }

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Apply global pipes and filters
  app.useGlobalPipes(ValidationPipe);
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configure Swagger
  const options = new DocumentBuilder()
    .setTitle('Shula API')
    .setDescription('API documentation for the Shula application')
    .setVersion('1.0')
    .addTag('groups', 'WhatsApp groups management')
    .addApiKey(
      { type: 'apiKey', name: 'x-participant-id', in: 'header' },
      'participant-id'
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api/docs', app, document, {
    yamlDocumentUrl: 'swagger/yaml',
  });

  // Start the server
  const port = process.env.PORT || 3000;
  await app.listen(port);

  // Log using consistent object format required by OpenTelemetry
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );

  Logger.log(
    `📚 Swagger documentation is available at: http://localhost:${port}/api/docs`
  );
}
bootstrap();
