#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting E2E tests in CI environment..."

# Clean up any existing containers to ensure a fresh environment
echo "🧹 Cleaning up existing test containers..."
docker compose -f ../../docker-compose.test.yml down -v 2>/dev/null || true

# Start the test containers
echo "🐳 Starting test containers..."
docker compose -f ../../docker-compose.test.yml up -d

# Wait for containers to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Force reset the database with migrations
echo "🔄 Resetting database with migrations..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/shula_test" \
npx prisma migrate reset --force --skip-seed

# Run the e2e tests
echo "🧪 Running E2E tests..."
NODE_OPTIONS="--experimental-vm-modules" \
NODE_ENV="test" \
TS_NODE_PROJECT=./test/tsconfig.e2e.json \
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/shula_test" \
REDIS_HOST="localhost" \
REDIS_PORT="6380" \
LANGFUSE_PUBLIC_KEY="" \
LANGFUSE_SECRET_KEY="" \
LANGFUSE_HOST="" \
jest --config ./test/jest-e2e.config.ts --testPathIgnorePatterns=conversations.e2e.test.ts --runInBand

# Always clean up containers after CI tests
echo "🧹 Cleaning up test containers..."
docker compose -f ../../docker-compose.test.yml down -v

echo "✅ E2E tests completed!"