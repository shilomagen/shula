# Shula Project Documentation

Welcome to the Shula project documentation. This folder contains comprehensive information about the project architecture, technical specifications, implementation details, and more.

## Table of Contents

1. [Architecture Overview](./architecture-overview.md) - High-level overview of the Shula system architecture
2. [Technical Specifications](./technical-specs.md) - Detailed technical specifications of system components
3. [Implementation Plan](./implementation-plan.md) - Project phases, milestones, and implementation timelines
4. [Face Recognition](./face-recognition.md) - Face recognition approaches, considerations, and implementation details

5. [Event Reference](./events-reference.md) - Shared event types used between services
6. [Docker Compose Setup](./docker-compose-setup.md) - Run the full stack locally with one command
7. [Conversation Engine](./conversation-engine.md) - How the graph engine drives user interactions
8. [Face Recognition Flow](./face-recognition-flow.md) - End-to-end photo processing steps

## What is Shula?

Shula is a WhatsApp bot that uses face recognition to intelligently distribute photos to specific group members. In a typical use case, parents in a school WhatsApp group would receive only the photos containing their children, rather than all photos shared in the group.

The system works by:
1. Being added to WhatsApp groups (initially in disabled state)
2. Being activated by an administrator for specific groups
3. Processing bulk photos shared in WhatsApp groups
4. Using face recognition to identify individuals in the photos
5. Privately forwarding relevant photos to corresponding parents

## Project Structure

The project is built as an NX workspace with the following main applications:

- **backend**: NestJS application providing the core API, database operations, and image processing capabilities
- **whatsapp-container**: Node.js application that handles WhatsApp integration and messaging

These applications communicate through a queue-based architecture to ensure reliability and scalability. Note that the WhatsApp container has specific scaling constraints due to its direct connection to WhatsApp Web.

## Getting Started

For developers new to the project, we recommend reading the documentation in the following order:

1. First, read the [Architecture Overview](./architecture-overview.md) to understand the high-level system design
2. Next, review the [Technical Specifications](./technical-specs.md) for details on components and interfaces
3. Then, check the [Implementation Plan](./implementation-plan.md) to understand the project roadmap
4. Finally, explore the [Face Recognition](./face-recognition.md) document for details on this core functionality

## Contributing

When contributing to the project documentation:

1. Follow the established Markdown formatting
2. Update the Table of Contents when adding new documents
3. Keep diagrams and visual aids up to date with the current architecture
4. Ensure technical accuracy in all documentation 