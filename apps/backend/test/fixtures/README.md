# Test Fixtures

This directory contains test fixtures for creating test data. Fixtures follow a consistent pattern to make test data creation easy and maintainable.

## Available Fixtures

- `GroupFixture`: For creating Group entities
- `ParticipantFixture`: For creating Participant entities
- `PersonFixture`: For creating Person entities

## Using Fixtures

All fixtures follow a consistent pattern with these standard methods:

- `valid(overrides)`: Generate a valid entity with optional overrides
- `invalid()`: Generate an invalid entity for negative testing
- `validList(count, overrides)`: Generate multiple valid entities

Additionally, some fixtures have specialized methods:

- `GroupFixture.withParticipants(groupOverrides, participants)`: Create a group with participants
- `PersonFixture.withFaces(faceCount, overrides)`: Create a person with face IDs

## Examples

### Basic Usage

```typescript
// Create a valid group with default values
const groupData = GroupFixture.valid();

// Create a valid group with custom values
const customGroupData = GroupFixture.valid({
  name: 'Custom Group Name',
  description: 'Custom description'
});

// Create a list of 5 participants
const participants = ParticipantFixture.validList(5);
```

### Using with Prisma

```typescript
// Create a group with participants
const testGroup = await prisma.group.create({
  data: GroupFixture.withParticipants(
    { name: 'Test Group' },
    ParticipantFixture.validList(3)
  ),
  include: {
    participants: {
      include: {
        participant: true
      }
    }
  }
});
```

### Using with BaseTest

```typescript
import { BaseTest } from '../e2e/utils/base-test';
import { GroupFixture, ParticipantFixture } from '../fixtures';

describe('Some Test', () => {
  const baseTest = new BaseTest();
  let testData;

  beforeEach(async () => {
    // Create test data using fixtures with BaseTest helper
    testData = await baseTest.createTestData(async (prisma) => {
      const participants = ParticipantFixture.validList(2);
      
      return prisma.group.create({
        data: GroupFixture.withParticipants({ name: 'Test Group' }, participants),
        include: { participants: { include: { participant: true } } }
      });
    });
  });

  // Tests using testData...
});
```

For more comprehensive examples, see `test/examples/fixture-usage-example.ts`. 