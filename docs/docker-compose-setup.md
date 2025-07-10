# Running Shula with Docker Compose

This guide explains how to launch all Shula services locally using Docker Compose. The provided `docker-compose.yml` runs Postgres, Redis, the backend API, the WhatsApp container and the admin UI.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose installed
- A WhatsApp account for authentication

## Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/shula.git
   cd shula
   ```

2. **Start the stack**
   ```bash
   docker compose up --build
   ```
   The first run builds the Docker images and may take a few minutes.

3. **Authenticate WhatsApp**
   - Watch the logs of the `whatsapp` service. When it starts for the first time it prints a QR code.
   - Scan the QR code with the WhatsApp mobile app to link the bot account.

4. **Access the services**
   - Backend API: [http://localhost:3000/api](http://localhost:3000/api)
   - Admin UI: [http://localhost:3200](http://localhost:3200)

5. **Stopping the stack**
   ```bash
   docker compose down
   ```

With this setup anyone can experiment with Shula locally or deploy it to their own environment with minimal effort.
