import { BaseTest } from './utils/base-test';
import request from 'supertest';

describe('Health (e2e)', () => {
  const baseTest = new BaseTest();

  beforeAll(async () => {
    await baseTest.setup();
  });

  afterAll(async () => {
    await baseTest.teardown();
  });

  // Clean database after each test
  afterEach(async () => {
    await baseTest.cleanDatabase();
  });

  it('GET /health', async () => {
    const response = await request(baseTest.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
    });
  });
});
