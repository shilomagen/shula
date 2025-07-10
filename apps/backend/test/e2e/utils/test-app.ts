import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bodyParser from 'body-parser';
import { AppModule } from '../../../src/app/app.module';
import { HttpExceptionFilter } from '../../../src/common/filters/http-exception.filter';
import { ValidationPipe as CustomValidationPipe } from '../../../src/common/pipes/validation.pipe';
import { PrismaService } from '../../../src/database/prisma.service';
import { MockFactory } from '../../mocks/mock-factory';
import { DatabaseCleaner } from '../../utils/database-cleaner';

export interface TestContext {
  app: INestApplication;
  moduleRef: TestingModule;
  databaseCleaner: DatabaseCleaner;
}

export async function createTestApp(): Promise<TestContext> {
  // Create a test module builder
  const testModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });

  // Override providers with mocks
  const mocks = MockFactory.getMocks();
  for (const [token, mock] of Object.entries(mocks)) {
    testModuleBuilder.overrideProvider(token).useValue(mock);
  }

  // Compile the module
  const moduleFixture: TestingModule = await testModuleBuilder.compile();

  const app = moduleFixture.createNestApplication();

  // Set global prefix with exclusion for health endpoint
  app.setGlobalPrefix('api', {
    exclude: ['/health'],
  });

  // Configure body parser for large payloads
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Apply global pipes and filters
  app.useGlobalPipes(CustomValidationPipe);
  app.useGlobalFilters(new HttpExceptionFilter());

  // Initialize the application
  await app.init();

  // Create database cleaner
  const prismaService = moduleFixture.get<PrismaService>(PrismaService);
  const databaseCleaner = new DatabaseCleaner(prismaService);

  return {
    app,
    moduleRef: moduleFixture,
    databaseCleaner,
  };
}
