import './tracing';
import { Logger as NestLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['/health'],
  });
  const port = process.env.PORT || 3000;
  await app.listen(port);
  NestLogger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
