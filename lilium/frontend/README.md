# Lilium Frontend

A modern web application built with Next.js 14, React, TypeScript, and Tailwind CSS.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation

## Features

- Server-side rendering with Next.js App Router
- Type-safe API calls
- Global state management with Zustand
- Form validation with React Hook Form and Zod
- Responsive design with Tailwind CSS
- Authentication flow
- API integration with backend

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend server running on port 3000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Environment variables are already configured in `.env.local`

### Development

Start the development server:

```bash
npm run dev
```

The application will start at `http://localhost:3001`

## Available Scripts

- `npm run dev` - Start development server on port 3001
- `npm run build` - Build for production
- `npm run start` - Start production server on port 3001
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── src/
│   ├── app/             # Next.js App Router pages
│   ├── components/      # Reusable React components
│   ├── lib/            # Utility functions and API client
│   │   └── api.ts      # Axios API client
│   └── store/          # Zustand stores
│       └── auth.ts     # Authentication store
├── public/             # Static assets
├── .env.local         # Environment variables
├── package.json       # Dependencies and scripts
├── tailwind.config.ts # Tailwind CSS configuration
└── tsconfig.json      # TypeScript configuration
```

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## API Integration

The frontend connects to the backend API at `http://localhost:3000/api`. Make sure the backend is running before starting the frontend.

### Available API Services

- **Auth Service** - Registration, login, token verification
- **Users Service** - CRUD operations for users
- **Health Service** - API health check

## State Management

- **Zustand** for global client state (authentication, user data)
- **React Query** for server state (API data caching and synchronization)

## Forms

Forms are handled with React Hook Form and validated with Zod schemas for type-safe form validation.

## Styling

The application uses Tailwind CSS for styling with a mobile-first responsive approach.