# WhatsApp Container

## Overview

The WhatsApp Container Service is a critical component of the Shula system, responsible for maintaining connections to WhatsApp Web and handling message processing. This service acts as a bridge between WhatsApp groups and the Shula backend system, enabling the intelligent distribution of photos based on face recognition.

## Architecture

The WhatsApp Container Service is built using NestJS and follows a modular, queue-based architecture to ensure reliability and resilience. The service is designed to maintain stable WhatsApp connections and automatically recover from disconnections or failures.

### Key Components

#### 1. WhatsApp Module

The core module that manages WhatsApp connections and message processing:

- **WhatsAppService**: Manages the WhatsApp client lifecycle, including initialization, authentication, and connection management.
- **WhatsAppModule**: Configures the module dependencies and exports the WhatsApp service.

#### 2. Queue System

A robust queue system built on BullMQ and Redis for reliable job processing:

- **QueueModule**: Configures the BullMQ integration with Redis.
- **BaseQueueService**: Abstract base class for queue services with common functionality.
- **BaseQueueProcessor**: Abstract base class for queue processors with common functionality.

#### 3. WhatsApp Connection Queue

Specialized queue for managing WhatsApp connection health:

- **WhatsAppConnectionQueueService**: Schedules health checks and connection resets.
- **ConnectionHealthCheckProcessor**: Processes health check jobs to ensure connection stability.
- **ConnectionResetProcessor**: Processes connection reset jobs to recover from failures.

#### 4. Configuration

Centralized configuration management:

- **ConfigModule**: Manages application configuration using NestJS ConfigModule.
- **Environment Variables**: Configuration via environment variables for different environments.

## Docker Container

The WhatsApp Container is packaged as a Docker image that includes all necessary dependencies for running WhatsApp Web in a headless browser environment.

### Architecture-Specific Browser Setup

The Dockerfile is designed to support both amd64 (x86_64) and arm64 architectures:

- **For amd64 (Production/CI)**: Installs Google Chrome, which is well-tested with Puppeteer in production environments.
- **For arm64 (Local Development)**: Installs Chromium, which provides better compatibility on ARM-based systems like Apple Silicon.

The container automatically detects the system architecture and installs the appropriate browser:

```dockerfile
# Architecture-specific browser installation
RUN if [ "$(uname -m)" = "x86_64" ]; then
    # Install Google Chrome for amd64 (production)
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    echo "Using Google Chrome for amd64" && \
    export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable; \
else
    # Install Chromium for arm64 (local development)
    apt-get update && \
    apt-get install -y chromium && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    echo "Using Chromium for arm64" && \
    export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium; \
fi
```

This approach ensures that the container works properly in both local development environments (typically ARM64 on newer Macs) and production environments (typically AMD64 on CI/CD systems and cloud providers).

## Flow Diagrams

### Connection Management Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  WhatsAppModule │     │  WhatsAppService│     │  QR Code        │
│  (on init)      │────▶│  initialize()   │────▶│  Generation     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                        │
                                ▼                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Connection     │     │  WhatsApp Web   │     │  User Scans     │
│  Queue Service  │◀────│  Client         │◀────│  QR Code        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐
│  Health Check   │     │  Client Ready   │
│  Job Scheduler  │     │  Event          │
└─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────┐
│  Connection     │
│  Reset Scheduler│
└─────────────────┘
```

### Health Check Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Scheduled      │     │  Health Check   │     │  WhatsApp       │
│  Health Check   │────▶│  Processor      │────▶│  Service        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Log Results    │◀────│  Process        │◀────│  Check          │
│                 │     │  Results        │     │  Connection      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Key Features

- **Resilient Connections**: Automatically detects and recovers from connection issues
- **QR Code Authentication**: Generates and displays QR codes for WhatsApp Web authentication
- **Scheduled Health Checks**: Regularly verifies connection health (every 10 seconds)
- **Automatic Connection Reset**: Periodically resets connections to prevent stale sessions (every hour)
- **Graceful Shutdown**: Properly closes WhatsApp connections on service shutdown
- **Event-Based Architecture**: Reacts to WhatsApp events (ready, disconnected, auth_failure)
- **Efficient State Reset**: Uses `client.resetState()` for efficient connection resets without full client recreation
- **Cross-Architecture Support**: Works on both ARM64 (local development) and AMD64 (production) environments

## Technical Implementation

### WhatsApp Client

The service uses the `whatsapp-web.js` library to interact with WhatsApp Web:

- **Authentication**: Uses `RemoteAuth` strategy with AWS S3 to persist sessions across deployments
- **Headless Browser**: Runs in headless mode using Puppeteer
- **Event Handling**: Listens for various WhatsApp events (qr, ready, auth_failure, disconnected)

### Queue Implementation

The service uses BullMQ for reliable job scheduling:

- **Job Schedulers API**: Uses the BullMQ Job Schedulers API for recurring jobs
- **Health Check Schedule**: Runs every 10 seconds using cron pattern `*/10 * * * * *`
- **Connection Reset Schedule**: Runs every hour using cron pattern `0 * * * *`

## Configuration

### Environment Variables

The service can be configured using the following environment variables:

```
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Server Configuration
PORT=3100

# AWS S3 Configuration for WhatsApp Session Storage
BUCKET_STATE_NAME=shula-whatsapp-sessions
AWS_REGION=us-east-1
BUCKET_STATE_ACCESS_KEY=your_access_key_id
BUCKET_STATE_SECRET_KEY=your_secret_access_key
WHATSAPP_SESSION_ID=shula-whatsapp
WHATSAPP_BACKUP_SYNC_INTERVAL_MS=300000

# Puppeteer Configuration
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable  # For AMD64 (production)
# or
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium  # For ARM64 (local development)
```

### Default Configuration

- **Redis**: Defaults to localhost:6379 if not specified
- **WhatsApp Session**: Stored in AWS S3 using the `wwebjs-s3` package
- **Session S3 Bucket**: Defaults to 'shula-whatsapp-sessions' if not specified
- **AWS Region**: Defaults to 'us-east-1' if not specified
- **Session ID**: Defaults to 'shula-whatsapp' if not specified
- **Backup Sync Interval**: Defaults to 300000ms (5 minutes) if not specified
- **Puppeteer**: Configured with security args (`--no-sandbox`, `--disable-setuid-sandbox`)
- **Browser Path**: Automatically determined based on architecture (Chrome for AMD64, Chromium for ARM64)

## Getting Started

### Prerequisites

- Node.js 16+
- Redis server
- NX CLI

### Installation

```bash
# Install dependencies
npm install

# Build the service
npx nx build whatsapp-container

# Run the service
npx nx serve whatsapp-container
```

### Authentication

When the service starts for the first time, it will generate a QR code in the console. Scan this QR code with your WhatsApp mobile app to authenticate the session.

## Development

### Running in Development Mode

```bash
# Start Redis (if not already running)
docker-compose up -d redis

# Run the service in development mode
npx nx serve whatsapp-container
```

### Testing

```bash
# Run unit tests
npx nx test whatsapp-container

# Run e2e tests
npx nx e2e whatsapp-container
```

## Deployment Considerations

- **Stateful Service**: The WhatsApp Container is stateful due to its persistent connection to WhatsApp Web
- **Scaling Limitations**: Cannot be horizontally scaled for a single WhatsApp account
- **Session Persistence**: Uses AWS S3 for WhatsApp session data, enabling easier deployment across environments
- **Resource Requirements**: Needs sufficient memory for Puppeteer browser instance
- **AWS Permissions**: Requires AWS IAM permissions for S3 bucket access (GetObject, PutObject, DeleteObject)
- **Architecture Compatibility**: Automatically adapts to the host architecture (AMD64 or ARM64)

## Troubleshooting

### Common Issues

1. **Authentication Failures**: 
   - Ensure the WhatsApp account is not logged in on too many devices
   - Check that AWS S3 credentials are correct and the bucket exists
   - Verify IAM permissions for the S3 bucket

2. **Connection Issues**:
   - Verify Redis connection is working
   - Check network connectivity to WhatsApp servers
   - Ensure Puppeteer dependencies are installed

3. **Performance Issues**:
   - Increase available memory for the container
   - Check CPU usage during operation

4. **Architecture-Related Issues**:
   - If running on ARM64 and experiencing browser issues, verify Chromium is installed correctly
   - If running on AMD64 and experiencing browser issues, verify Chrome is installed correctly

## License

This project is proprietary and confidential. Unauthorized copying, transfer, or reproduction of the contents is strictly prohibited. 