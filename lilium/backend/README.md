# Lilium Backend

A modern backend API built with Node.js, Fastify, and Prisma ORM.

## Tech Stack

- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe development
- **Fastify** - Fast and efficient web framework
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Database (via Prisma Postgres for local development)
- **JWT** - Authentication

## Features

- RESTful API with Swagger documentation
- JWT-based authentication
- User management (CRUD operations)
- Type-safe database queries with Prisma
- Environment-based configuration
- CORS support
- Request logging

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
- The `.env` file has been created with default values
- Update the `DATABASE_URL` if needed

3. Start local Prisma Postgres database (optional):
```bash
npm run prisma:dev
```

4. Generate Prisma Client:
```bash
npm run prisma:generate
```

5. Run database migrations:
```bash
npm run prisma:migrate
```

### Development

Start the development server with hot-reload:

```bash
npm run dev
```

The server will start at `http://localhost:3000`

### API Documentation

Once the server is running, you can access:
- Swagger UI: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/api/health`

## Available Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio GUI
- `npm run prisma:dev` - Start local Prisma Postgres server

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users` - Get all users (protected)
- `GET /api/users/:id` - Get user by ID (protected)
- `PUT /api/users/:id` - Update user (protected)
- `DELETE /api/users/:id` - Delete user (protected)

### Health
- `GET /api/health` - Health check

## Project Structure

```
backend/
├── src/
│   ├── routes/         # API route handlers
│   │   ├── auth.ts     # Authentication routes
│   │   ├── users.ts    # User management routes
│   │   └── health.ts   # Health check routes
│   └── server.ts       # Main server file
├── prisma/
│   └── schema.prisma   # Database schema
├── .env                # Environment variables
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=<your-database-url>
JWT_SECRET=<your-jwt-secret>
FRONTEND_URL=http://localhost:3001
```

## Security Notes

- Change the `JWT_SECRET` in production
- Use HTTPS in production
- Configure CORS properly for your frontend domain
- Keep dependencies updated