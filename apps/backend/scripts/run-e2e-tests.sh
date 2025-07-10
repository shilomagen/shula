#!/bin/bash

# Exit on error
set -e

# Cleanup function to be called on script exit
cleanup() {
  echo "Cleaning up resources..."
  # We don't shut down containers here to allow for faster repeat testing
  # To shut down containers, use npm run test:e2e:backend:down
}

# Register cleanup function to be called on script exit
trap cleanup EXIT

echo "Starting E2E test environment..."

# Start Docker containers if not already running
if ! docker ps | grep -q shula-postgres-test; then
  echo "Starting test containers..."
  docker compose -f ../../docker-compose.test.yml up -d
  
  # Wait for containers to be ready
  echo "Waiting for containers to be ready..."
  sleep 5
fi

# Force run migrations to reset the database
echo "Resetting database schema with migrations..."
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/shula_test" \
npx prisma migrate reset --force --skip-seed

# Run the e2e tests with the specific TypeScript config
echo "Running e2e tests..."
NODE_OPTIONS="--experimental-vm-modules" \
NODE_ENV="test" \
TS_NODE_PROJECT=./test/tsconfig.e2e.json \
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/shula_test" \
REDIS_HOST="localhost" \
REDIS_PORT="6380" \
LANGFUSE_PUBLIC_KEY="" \
LANGFUSE_SECRET_KEY="" \
LANGFUSE_HOST="" \
npx jest --config ./test/jest-e2e.config.ts --runInBand

echo "E2E tests completed!"