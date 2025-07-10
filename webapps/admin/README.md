# Shula Admin

This is the admin dashboard for the Shula application. It provides an interface for managing groups, participants, and other aspects of the Shula platform.

## Features

- Authentication with NextAuth
- Dashboard with key metrics
- Groups management with pagination
- Responsive UI with ShadCN components

## Tech Stack

- Next.js 15
- React 19
- TanStack Query for data fetching
- TanStack Table for data tables
- ShadCN UI components
- TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3200](http://localhost:3200) in your browser.

## Project Structure

- `/app` - Next.js app router pages and layouts
- `/components` - Reusable UI components
- `/lib` - Utility functions and hooks
- `/generated` - Auto-generated API clients

## API Client Generation

The API clients are generated from the OpenAPI specification using the OpenAPI Generator. To regenerate the clients, run:

```bash
npm run generate:api-types
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
