# SHULA Project Commands & Guidelines

## Project Overview
Shula is a WhatsApp bot that uses face recognition to distribute photos within WhatsApp groups.
When photos are shared in a group, Shula identifies individuals and forwards relevant photos to
their parents. Built as an NX monorepo with Backend (NestJS) and WhatsApp Container services.

## Build & Development
- Build all: `npm run build`
- Dev mode: `npm run dev` (starts infra + all services)
- Backend only: `npm run dev:backend` (most common for development)
- WhatsApp service: `npm run dev:whatsapp` 
- Infrastructure: `npm run dev:infra`
- Admin UI: `cd webapps/admin && npm run dev` (Next.js application)

## Testing
- Run all tests: `npm run test`
- E2E tests (all services): `npm run test:e2e`
- Backend E2E tests: `npm run test:e2e:backend` (with infra setup)
- Clean up test infra: `npm run test:e2e:backend:down`
- Single test: `TS_NODE_PROJECT=./test/tsconfig.e2e.json jest --config ./test/jest-e2e.config.ts <test-path>`
- Filter tests: `jest --config ./test/jest.config.ts -t "<test-name-pattern>"`

## Quality
- Lint: `npm run lint` or `npm run lint:fix`
- Format: `npm run format`

## Database
- Migrations: `npm run db:migrate` (dev) or `npm run db:migrate:prod`
- Reset DB: `npm run db:reset`
- Studio: `npm run db:studio` (visual DB explorer)

## Code Style
- TypeScript: Interfaces over types, no `any`, discriminated unions with enums
- Naming: PascalCase (classes), camelCase (vars/funcs), kebab-case (files)
- Functions: Pure, single purpose, early returns, descriptive names
- Architecture: NestJS modules by domain, DTOs for I/O validation
- Error handling: Custom exception filters, proper HTTP status codes
- Testing: Independent tests with driver pattern and fixtures
- UI: ShadcnUI components with Tailwind, RTL support, Hebrew localization