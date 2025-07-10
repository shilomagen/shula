#!/bin/bash

# Start the test containers if they're not already running
docker-compose -f docker-compose.test.yml up -d

# Set the environment variables for the tests
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/shula_test"
export REDIS_URL="redis://localhost:6380"

# Run the tests
npm run test:e2e 