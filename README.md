# Shula - WhatsApp Photo Distribution Bot

<div align="center">
  <img src="docs/shula.png" alt="Shula Logo" width="300">
</div>

## Project Overview

Shula is a WhatsApp bot that uses face recognition to intelligently distribute photos within WhatsApp groups. When photos are shared in a group, Shula identifies individuals (typically children) in the photos and forwards only relevant photos to their parents, eliminating the clutter of receiving all group photos.

### Key Features

- **Automated Photo Distribution**: Parents receive only photos containing their children
- **Face Recognition**: Advanced facial recognition for accurate matching
- **Multi-Group Support**: Works simultaneously in hundreds of WhatsApp groups
- **Multi-Child Support**: Parents can register multiple children for recognition
- **High Availability**: Stateless WhatsApp container ensures reliable service

## Architecture

Shula is built as an NX monorepo with two main services:

- **Backend Service (NestJS)**: Core processing engine, API, database operations
- **WhatsApp Container**: Manages WhatsApp connections and messaging

The system is containerized with Docker and deployed using Amazon ECS (Elastic Container Service).

## Getting Started

### Quick Start with Docker Compose
1. Ensure Docker is installed.
2. Run `docker compose up --build` to start all services.
3. Scan the QR code from the `whatsapp` container logs to authenticate.
4. Access the admin UI at http://localhost:3200 and the API at http://localhost:3000/api.


### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL
- Redis

### Development Setup

1. Clone the repository
   ```
   git clone https://github.com/your-org/shula.git
   cd shula
   ```

2. Run the setup script
   ```
   ./scripts/setup.sh
   ```
   
   This script will:
   - Check prerequisites
   - Install dependencies
   - Start infrastructure (PostgreSQL and Redis)
   - Set up the database
   - Build shared packages

3. Start the application
   ```
   npm run dev:all
   ```

4. Access the services:
   - Backend API: http://localhost:3000/api
   - Swagger API docs: http://localhost:3000/api/docs

## Development Scripts

### 🚀 Development Commands

Command | Description |
|---------|-------------|
| `npm run dev` | Start everything (infrastructure + all services) |
| `npm run dev:all` | Start all services (backend + WhatsApp) |
| `npm run dev:backend` | Start only the backend service |
| `npm run dev:whatsapp` | Start only the WhatsApp container |

### 🏗️ Infrastructure Commands

| Command | Description |
|---------|-------------|
| `npm run dev:infra` | Start development infrastructure (PostgreSQL + Redis) |
| `npm run dev:infra:logs` | View logs from infrastructure containers |
| `npm run dev:infra:down` | Stop infrastructure containers |
| `npm run dev:infra:restart` | Restart infrastructure containers |

### 📦 Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio to view/edit data |
| `npm run db:reset` | Reset the database (caution: deletes all data) |

### 🧪 Testing Commands

| Command | Description |
|---------|-------------|
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:infra` | Start test infrastructure |
| `npm run test:infra:down` | Stop test infrastructure |

### 🏭 Build Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Build all projects |
| `npm run build:backend` | Build only the backend |
| `npm run build:whatsapp` | Build only the WhatsApp container |
| `npm run build:shared` | Build shared packages |

### 🧹 Utility Commands

| Command | Description |
|---------|-------------|
| `npm run clean` | Clean all build artifacts and node_modules |
| `npm run clean:dist` | Clean only build artifacts |
| `npm run format` | Format code with Prettier |
| `npm run lint` | Run linting |
| `npm run lint:fix` | Fix linting issues |

## Project Structure

```
shula/
├── apps/
│   ├── backend/                 # Core NestJS backend service
│   ├── whatsapp-container/      # WhatsApp integration service
├── docs/                        # Project documentation
├── packages/                    # Shared libraries
└── ...
```

## License

This project is licensed under the [MIT License](./LICENSE).

---

## NX Workspace Information

✨ Your new, shiny [Nx workspace](https://nx.dev) is almost ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/nx-api/js?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Finish your CI setup

[Click here to finish setting up your workspace!](https://cloud.nx.app/connect/eAt0QU1RTv)


## Generate a library

```sh
npx nx g @nx/js:lib packages/pkg1 --publishable --importPath=@my-org/pkg1
```

## Run tasks

To build the library use:

```sh
npx nx build pkg1
```

To run any task with Nx use:

```sh
npx nx <target> <project-name>
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Versioning and releasing

To version and release the library use

```
npx nx release
```

Pass `--dry-run` to see what would happen without actually releasing the library.

[Learn more about Nx release &raquo;](hhttps://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Keep TypeScript project references up to date

Nx automatically updates TypeScript [project references](https://www.typescriptlang.org/docs/handbook/project-references.html) in `tsconfig.json` files to ensure they remain accurate based on your project dependencies (`import` or `require` statements). This sync is automatically done when running tasks such as `build` or `typecheck`, which require updated references to function correctly.

To manually trigger the process to sync the project graph dependencies information to the TypeScript project references, run the following command:

```sh
npx nx sync
```

You can enforce that the TypeScript project references are always in the correct state when running in CI by adding a step to your CI job configuration that runs the following command:

```sh
npx nx sync:check
```

[Learn more about nx sync](https://nx.dev/reference/nx-commands#sync)


[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/nx-api/js?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:
- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
