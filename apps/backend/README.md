# Shula Backend

This is the backend service for the Shula application, built with NestJS and Prisma.

## Description

The Shula backend provides a RESTful API for managing WhatsApp groups, participants, persons, and photos with facial recognition capabilities.

## Installation

```bash
# Install dependencies
npm install
```

## Database Setup

### Option 1: Using Docker Compose (Recommended)

The easiest way to set up the database is to use the Docker Compose file provided in the root of the project:

```bash
# Start the PostgreSQL database
docker-compose -f ../../docker-compose.dev.yml up -d
```

This will start a PostgreSQL database with the following configuration:
- Host: localhost
- Port: 5432
- Username: postgres
- Password: postgres
- Database: shula

### Option 2: Manual Setup

1. Make sure you have PostgreSQL installed and running
2. Create a database named `shula`
3. Update the `.env` file with your database connection string

## Prisma Setup

After setting up the database, you need to generate the Prisma client and run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (when database is available)
npx prisma migrate dev
```

## Running the app

```bash
# Development
npm run start

# Watch mode
npm run start:dev

# Production mode
npm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:

```
http://localhost:3000/api/docs
```

## Features

- WhatsApp groups management
- Participants management
- Persons (children) management
- Face recognition data management
- Photo processing and distribution

## API Endpoints

### Groups

- `GET /api/v1/groups` - List all groups
- `GET /api/v1/groups/:id` - Get group details
- `POST /api/v1/groups` - Create a new group
- `PUT /api/v1/groups/:id` - Update group details
- `PATCH /api/v1/groups/:id/status` - Update group status
- `DELETE /api/v1/groups/:id` - Delete a group

More endpoints will be added as development progresses. 