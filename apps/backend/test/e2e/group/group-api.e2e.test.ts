import { Group } from '@prisma/client';
import { PaginatedResponseDto } from '../../../src/common/dtos/paginated-response.dto';
import { GroupWithCountsResponseDto } from '../../../src/modules/groups/dto/group-with-counts-response.dto';
import { GroupsResponseDto } from '../../../src/modules/groups/dto/groups-response.dto';
import { GroupFixture, ParticipantFixture } from '../../fixtures';
import { GroupsApi } from '../../generated-client/api/groups-api';
import { Configuration } from '../../generated-client/configuration';
import { BaseTest } from '../utils/base-test';

/**
 * Extended base test with GroupsApi support
 */
class GroupApiTest extends BaseTest {
  protected groupsApi!: GroupsApi;

  override async setup(): Promise<void> {
    await super.setup();

    // Initialize API client
    const basePath = this.getUrl();
    const config = new Configuration({ basePath });
    this.groupsApi = new GroupsApi(config);
  }

  /**
   * Get the groups API for use in tests
   */
  getGroupsApi(): GroupsApi {
    return this.groupsApi;
  }
}

describe('Group API (e2e)', () => {
  const baseTest = new GroupApiTest();
  let testGroup: Group;

  beforeAll(async () => {
    await baseTest.setup();
  });

  afterAll(async () => {
    await baseTest.teardown();
  });

  afterEach(async () => {
    await baseTest.cleanDatabase();
  });

  beforeEach(async () => {
    // Create test data before each test using fixtures
    const participants = ParticipantFixture.validList(2);

    testGroup = await baseTest.createTestData(async (prisma) => {
      // Create a test group with participants using the fixture
      return await prisma.group.create({
        data: GroupFixture.withParticipants(
          {
            name: 'Test Group',
            description: 'A test group for e2e testing',
          },
          participants
        ),
        include: {
          participants: {
            include: {
              participant: true,
            },
          },
        },
      });
    });
  });

  describe('GET /api/v1/groups', () => {
    it('should return paginated list of groups', async () => {
      // Use the API client instead of direct HTTP request
      const response = await baseTest.getGroupsApi().getAllGroups();

      // Use toMatchObject with type checking for more concise assertions
      expect(response.data).toMatchObject<
        PaginatedResponseDto<GroupsResponseDto>
      >({
        items: expect.any(Array),
        page: expect.any(Number),
        size: expect.any(Number),
        total: expect.any(Number),
        pages: expect.any(Number),
      });

      // Check that our test group is in the response
      expect(response.data.items).toContainEqual(
        expect.objectContaining({
          id: testGroup.id,
          name: 'Test Group',
        })
      );
    });
  });

  describe('GET /api/v1/groups/:id', () => {
    it('should return a single group by id', async () => {
      // Use the API client instead of direct HTTP request
      const response = await baseTest.getGroupsApi().getGroupById(testGroup.id);

      expect(response.data).toMatchObject<GroupsResponseDto>({
        id: testGroup.id,
        name: 'Test Group',
        description: 'A test group for e2e testing',
        whatsappGroupId: expect.any(String),
        status: expect.any(String),
        createdAt: expect.any(String),
      });
    });

    it('should return 404 for non-existent group', async () => {
      // Use the API client and expect it to throw an error
      await expect(
        baseTest.getGroupsApi().getGroupById('non-existent-id')
      ).rejects.toThrow();
    });
  });

  describe('GET /api/v1/groups/:id/counts', () => {
    it('should return group with participant and person counts', async () => {
      // Use the API client instead of direct HTTP request
      const response = await baseTest
        .getGroupsApi()
        .getGroupWithCountsById(testGroup.id);

      expect(response.data).toMatchObject<GroupWithCountsResponseDto>({
        id: testGroup.id,
        name: 'Test Group',
        participantsCount: 2,
        personsCount: expect.any(Number),
        whatsappGroupId: expect.any(String),
        status: expect.any(String),
        createdAt: expect.any(String),
      });
    });
  });
});
