# Backend Testing Guide

## Overview

This directory contains tests for the backend application, including end-to-end (e2e) tests and fixtures for test data generation.

## Testing Structure

- `e2e/`: Contains end-to-end tests that test the application's APIs
- `fixtures/`: Contains factories for generating test data

## Testing Approach

### End-to-End Tests

Our e2e tests use a `BaseTest` class that handles common test setup and teardown tasks:

- Setting up a test application instance
- Cleaning the database between tests
- Providing utilities for test data creation

### Type-Safe Assertions

We use the application's DTOs directly for type-safe assertions in tests:

```typescript
// Example of a type-safe assertion using DTOs
expect(response.body).toMatchObject<GroupsResponseDto>({
  id: 'some-id',
  name: 'Test Group',
  // ...other required properties
});
```

This approach has several benefits:
- Catches type errors at compile time
- Documents the expected response structure
- Makes tests more maintainable when API responses change
- Ensures tests and application code stay in sync (when DTOs change, tests must change too)

### Test Data Generation

Test data is created using fixture factories that provide a consistent way to generate entities:

```typescript
// Example of creating test data with fixtures
const group = await baseTest.createTestData(async (prisma) => {
  return await prisma.group.create({
    data: GroupFixture.valid(),
  });
});
```

## Running Tests

To run all e2e tests:
```
npm run test:e2e
```

To run a specific test file:
```
npm run test:e2e -- path/to/test-file.e2e.test.ts
``` 