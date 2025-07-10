#!/bin/bash

# Exit on error
set -e

echo "🚀 Setting up Shula development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker and try again."
  exit 1
fi

# Start PostgreSQL using Docker Compose
echo "🐘 Starting PostgreSQL database..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Generate Prisma client
echo "🔧 Generating Prisma client..."
cd apps/backend && npx prisma generate

# Check if PostgreSQL is ready
echo "🔍 Checking if PostgreSQL is ready..."
if docker exec shula-postgres pg_isready -U postgres > /dev/null 2>&1; then
  echo "✅ PostgreSQL is ready!"
  
  # Run Prisma migrations
  echo "🔄 Running Prisma migrations..."
  npx prisma migrate dev --name init
  
  echo "✅ Development environment setup complete!"
  echo "📝 You can now start the backend with: npx nx serve backend"
else
  echo "❌ PostgreSQL is not ready. Please check your Docker setup."
  exit 1
fi 