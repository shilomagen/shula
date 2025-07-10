#!/bin/bash

# Exit on error
set -e

echo "Shutting down E2E test infrastructure..."

# Shut down test containers
docker compose -f ../../docker-compose.test.yml down

echo "E2E test infrastructure has been shut down"