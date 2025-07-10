# Build stage
FROM node:lts-alpine as builder

# Add build argument for Sentry auth token
ARG SENTRY_AUTH_TOKEN

WORKDIR /app

# Set Sentry auth token as environment variable
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

# Copy root workspace files needed for building
COPY package.json package-lock.json nx.json ./
COPY apps/backend/package.json ./apps/backend/

# Install dependencies
RUN npm ci


# Copy source code (except what's in .dockerignore)
COPY . .

RUN npx nx build backend
# RUN npm run build:backend:production

# Production stage
FROM node:lts-alpine as production

WORKDIR /app
RUN apk add --no-cache libc6-compat curl

COPY package.json package-lock.json nx.json ./
COPY packages/ ./packages/


COPY --from=builder /app/dist/apps/backend ./apps/backend

# Install production dependencies based on the generated package.json
RUN npm ci --omit=dev

# Generate Prisma client in production
RUN npm run db:generate

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Expose port
EXPOSE 3000

# Run migrations and start the application
CMD ["sh", "-c", "npm run db:migrate:prod && node apps/backend/main.js"]