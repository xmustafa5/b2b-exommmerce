# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack monorepo containing three interconnected applications:
- **backend/** - Fastify API server with Prisma ORM and JWT authentication
- **frontend/** - Next.js 14 web application with App Router
- **mobile/** - React Native mobile app using Expo

## CRITICAL DEVELOPMENT REQUIREMENTS

### Context7 Documentation (MANDATORY)
**ALWAYS use Context7 MCP server** to fetch up-to-date documentation for any library or framework when implementing features. This is NOT optional. Use the following workflow:

1. Call `resolve-library-id` to get the Context7-compatible library ID
2. Call `get-library-docs` with the resolved ID to get documentation
3. Follow the latest patterns and best practices from the documentation

**Required Context7 lookups for common tasks:**
- Before using React Query: Fetch `@tanstack/react-query` docs
- Before using shadcn/ui: Fetch `shadcn/ui` docs
- Before using Fastify: Fetch `fastify` docs
- Before using Prisma: Fetch `prisma` docs
- Before using React Hook Form: Fetch `react-hook-form` docs
- Before using Zod: Fetch `zod` docs
- **Before adding ANY Fastify plugin**: Fetch its Context7 documentation
- **Before writing ANY utility function**: Search Context7 for existing packages
- **Before implementing ANY feature**: Search Context7 for "[feature] fastify" or "[feature] npm"
- Before using any library: Fetch its latest documentation

### Frontend Development Standards

#### Required Libraries and Patterns
When developing frontend features, **ALWAYS use these libraries**:

1. **@tanstack/react-query** - For ALL server state management
   - Use for data fetching, caching, and synchronization
   - Implement optimistic updates for better UX
   - Set up proper query invalidation strategies
   - **ALWAYS use query keys from constants file**

2. **shadcn/ui** - For ALL UI components
   - Install components as needed: `npx shadcn-ui@latest add [component]`
   - Use shadcn/ui components instead of creating custom ones
   - Maintain consistent theming through shadcn/ui's design system

3. **react-hook-form** - For ALL form handling
   - Never use useState for form fields
   - Always integrate with Zod for validation
   - Use Controller components for custom inputs

4. **zod** - For ALL data validation
   - Create schemas for all forms
   - Use schemas for API response validation
   - Implement type inference from schemas

#### Query Keys Management (REQUIRED)
**ALWAYS create query keys in `src/constants/queryKeys.ts`**:

```typescript
// src/constants/queryKeys.ts
export const usersQueryKeys = {
  all: ["users"] as const,
  list: (...args: any[]) => ["users", "list", ...args] as const,
  detail: (id: string) => ["users", "detail", id] as const,
};

export const postsQueryKeys = {
  all: ["posts"] as const,
  list: (filters?: any) => ["posts", "list", filters] as const,
  detail: (id: string) => ["posts", "detail", id] as const,
  byUser: (userId: string) => ["posts", "byUser", userId] as const,
};

export const authQueryKeys = {
  profile: ["auth", "profile"] as const,
  session: ["auth", "session"] as const,
};

// Add more query keys for each entity
```

#### API Layer Structure (REQUIRED)
**ALWAYS organize API calls in `src/actions/` folder**:

```
src/
└── actions/
    ├── config.ts        # Axios configuration
    ├── users.ts         # User-related API calls
    ├── posts.ts         # Post-related API calls
    ├── auth.ts          # Auth-related API calls
    └── ...              # Other modules
```

**Example axios config (`src/actions/config.ts`)**:
```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Example API module (`src/actions/users.ts`)**:
```typescript
import { apiClient } from './config';
import type { User, UserCreateInput, UserUpdateInput } from '@/types/user';

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const { data } = await apiClient.get('/users');
    return data;
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data;
  },

  create: async (input: UserCreateInput): Promise<User> => {
    const { data } = await apiClient.post('/users', input);
    return data;
  },

  update: async (id: string, input: UserUpdateInput): Promise<User> => {
    const { data } = await apiClient.put(`/users/${id}`, input);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
```

#### TypeScript Types (REQUIRED)
**ALWAYS define types in `src/types/` folder**:

```
src/
└── types/
    ├── user.ts          # User-related types
    ├── post.ts          # Post-related types
    ├── auth.ts          # Auth-related types
    └── api.ts           # Common API types
```

**Example type definitions (`src/types/user.ts`)**:
```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  email: string;
  name: string;
  password: string;
}

export interface UserUpdateInput {
  email?: string;
  name?: string;
}
```

#### Using React Query with Query Keys and API Layer
**ALWAYS use this pattern for data fetching**:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersQueryKeys } from '@/constants/queryKeys';
import { usersApi } from '@/actions/users';

// Fetch list
export function useUsers(filters?: any) {
  return useQuery({
    queryKey: usersQueryKeys.list(filters),
    queryFn: () => usersApi.getAll(filters),
  });
}

// Fetch detail
export function useUser(id: string) {
  return useQuery({
    queryKey: usersQueryKeys.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
}

// Create mutation
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.all
      });
    },
  });
}

// Update mutation
export function useUpdateUser(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserUpdateInput) => usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.detail(id)
      });
      queryClient.invalidateQueries({
        queryKey: usersQueryKeys.all
      });
    },
  });
}
```

#### Frontend Component Structure
```typescript
// ALWAYS structure form components like this:
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const formSchema = z.object({
  // Define schema with Zod
})

type FormData = z.infer<typeof formSchema>

export function ComponentName() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {}
  })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // API call
    },
    onSuccess: () => {
      // Handle success
    }
  })

  // Component implementation
}
```

### Mobile Development Standards

#### Required Libraries
For React Native mobile development, **ALWAYS use**:

1. **@tanstack/react-query** - Same patterns as frontend
2. **react-hook-form** - Same patterns as frontend
3. **zod** - Same patterns as frontend
4. **React Native UI libraries** compatible with Expo:
   - Consider NativeBase, React Native Elements, or Tamagui
   - Maintain consistency with the web frontend design

### Backend Development Standards

#### CRITICAL: Maximize Package Usage, Minimize Custom Code
**FUNDAMENTAL PRINCIPLE**: Use existing Fastify plugins and npm packages for EVERYTHING. Write custom code ONLY when absolutely no package exists for the functionality.

#### Required Workflow for Backend Features
1. **ALWAYS search Context7 first** for existing Fastify plugins:
   - Authentication: Use `@fastify/jwt`, `@fastify/auth`, `@fastify/bearer-auth`
   - Validation: Use `@fastify/type-provider-zod` or `@fastify/type-provider-typebox`
   - CORS: Use `@fastify/cors`
   - Rate limiting: Use `@fastify/rate-limit`
   - File uploads: Use `@fastify/multipart`
   - Websockets: Use `@fastify/websocket`
   - Sessions: Use `@fastify/secure-session` or `@fastify/session`
   - Caching: Use `@fastify/caching` or `@fastify/redis`
   - Compression: Use `@fastify/compress`
   - Static files: Use `@fastify/static`
   - Cookies: Use `@fastify/cookie`
   - Health checks: Use `@fastify/under-pressure`
   - Metrics: Use `@fastify/metrics`

2. **Search Context7 for utility packages** before writing any helper functions:
   - Date manipulation: Use `date-fns` or `dayjs`
   - Validation: Use `zod`, `joi`, or `yup`
   - UUID generation: Use `uuid`
   - Encryption: Use `bcrypt`, `argon2`
   - Email: Use `nodemailer`, `@sendgrid/mail`
   - File operations: Use `fs-extra`
   - HTTP requests: Use `axios`, `got`
   - Environment: Use `dotenv`, `@fastify/env`
   - Logging: Use `pino` (built into Fastify)

3. **Package Selection Process**:
   - Search Context7 for "[functionality] fastify plugin"
   - If no Fastify plugin exists, search for Node.js packages
   - Compare packages by: downloads, maintenance, documentation
   - ONLY write custom code if no suitable package exists

#### API Implementation Requirements
1. **ALWAYS** use `@fastify/swagger` and `@fastify/swagger-ui` for API documentation
2. **ALWAYS** use `@fastify/type-provider-zod` for request/response validation
3. **ALWAYS** use existing error handling plugins like `@fastify/sensible`
4. **ALWAYS** implement proper error handling with meaningful messages
5. **ALWAYS** use TypeScript strict mode
6. **PREFER** Fastify plugins over Express middleware

#### Example: Adding Authentication (The Right Way)
```typescript
// ❌ WRONG: Writing custom JWT implementation
const jwt = require('jsonwebtoken');
const verifyToken = (token) => { /* custom code */ };

// ✅ CORRECT: Using Fastify plugins
import fastifyJwt from '@fastify/jwt';
import fastifyAuth from '@fastify/auth';

fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET
});

fastify.register(fastifyAuth);

// Use the plugin's built-in methods
fastify.decorate("authenticate", async function(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});
```

#### Prisma Best Practices
- Use Prisma's built-in validation
- Use `prisma-extension-pagination` for pagination
- Use `@prisma/client/extensions` for custom functionality
- Implement proper transaction handling for related operations
- Use select/include carefully to avoid over-fetching

## Essential Commands

### Full Stack Development (Recommended Order)
```bash
# 1. Start backend first (required by frontend and mobile)
cd backend
npm run dev          # Runs on http://localhost:3000

# 2. Start frontend web app
cd ../frontend
npm run dev          # Runs on http://localhost:3001

# 3. Start mobile app
cd ../mobile
npm start            # Opens Expo Dev Tools
```

### Backend Commands
```bash
cd backend
npm run dev                    # Start development server with hot-reload
npm run build                  # Compile TypeScript to JavaScript
npm run start                  # Start production server
npm run prisma:dev            # Start local Prisma Postgres database
npm run prisma:generate       # Regenerate Prisma Client after schema changes
npm run prisma:migrate        # Apply database migrations
npm run prisma:studio         # Open Prisma Studio GUI for database management
```

### Frontend Commands
```bash
cd frontend
npm run dev                    # Start Next.js dev server on port 3001
npm run build                  # Create production build
npm run start                  # Start production server
npm run lint                   # Run ESLint checks
```

### Mobile Commands
```bash
cd mobile
npm start                      # Start Expo development server
npm run android               # Launch on Android emulator
npm run ios                   # Launch on iOS simulator (macOS only)
npm run web                   # Launch in web browser (experimental)
```

## Architecture Overview

### Backend Architecture
The backend follows a layered architecture with clear separation:

1. **Entry Point**: `src/server.ts` - Fastify server setup with plugins
2. **Routes**: `src/routes/` - Modular route handlers (auth, users, health)
3. **Database**: Prisma ORM with PostgreSQL, schema in `prisma/schema.prisma`
4. **Authentication**: JWT-based with bcrypt password hashing
5. **API Documentation**: Auto-generated Swagger UI at `/docs`

Key architectural decisions:
- Routes are registered as Fastify plugins with prefixes
- Prisma client is decorated on the Fastify instance for global access
- Environment validation happens at startup via @fastify/env
- CORS configuration changes based on NODE_ENV

### Frontend Architecture
Next.js 14 with App Router pattern:

1. **API Client**: `src/lib/api.ts` - Axios instance with interceptors
2. **State Management**:
   - `src/store/auth.ts` - Zustand store for authentication
   - React Query for server state (to be configured in providers)
3. **Type Safety**: TypeScript throughout with Zod for runtime validation

Key patterns:
- API interceptors handle token injection and 401 responses automatically
- Zustand stores persist to localStorage
- Forms use React Hook Form with Zod schemas

### Mobile Architecture
React Native with Expo, mirroring frontend patterns:

1. **API Client**: `src/services/api.ts` - Similar to frontend but with AsyncStorage
2. **State Management**: `src/store/auth.ts` - Zustand with AsyncStorage persistence
3. **Platform Handling**: Different API URLs for iOS simulator, Android emulator, and physical devices

Mobile-specific considerations:
- API base URL must be configured per environment (see comments in api.ts)
- AsyncStorage replaces localStorage for persistence
- Token management handled asynchronously

## Cross-Application Data Flow

### Authentication Flow
1. User registers/logs in via frontend or mobile
2. Backend validates credentials and returns JWT token
3. Token stored in localStorage (web) or AsyncStorage (mobile)
4. Subsequent requests include token in Authorization header
5. Backend validates token on protected routes
6. 401 responses trigger automatic logout and redirect

### Database Schema Relations
The Prisma schema defines these relationships:
- User → Posts (one-to-many)
- User → Comments (one-to-many)
- Post → Comments (one-to-many)
- User + Post → Like (many-to-many through join table)

All relations use cascade delete for referential integrity.

## Development Dependencies

### Required Environment Setup
1. **Database**: Either Prisma Postgres (local) or PostgreSQL instance
2. **Ports**: 3000 (backend), 3001 (frontend), 19000+ (Expo)
3. **Node.js**: Version 18+ required

### Environment Variables
Backend requires:
- `DATABASE_URL` - Prisma connection string
- `JWT_SECRET` - Token signing key
- `PORT` - Server port (default: 3000)
- `FRONTEND_URL` - For CORS configuration

Frontend requires:
- `NEXT_PUBLIC_API_URL` - Backend API endpoint
- `NEXT_PUBLIC_APP_URL` - Frontend URL

Mobile configuration in code:
- Update `API_BASE_URL` in `src/services/api.ts` based on testing environment

## Common Development Scenarios

### Setting Up shadcn/ui in Frontend
```bash
cd frontend
npx shadcn-ui@latest init
# Choose: New York style, CSS variables, default colors
npx shadcn-ui@latest add form button input label toast dialog card
```

### Setting Up React Query Provider
Create `src/providers/query-provider.tsx`:
```typescript
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
```

### Adding a New Feature (Frontend)
1. **Fetch Context7 documentation** for any library you're using
2. **Create TypeScript types** in `src/types/[feature].ts`
3. **Add query keys** to `src/constants/queryKeys.ts`
4. **Create API module** in `src/actions/[feature].ts` with typed axios calls
5. **Create Zod schema** for form validation
6. **Generate form types** from schema using `z.infer`
7. **Create custom hooks** using React Query with query keys
8. **Build UI with shadcn/ui** components
9. **Implement forms** with react-hook-form and zodResolver

### File Structure Example for New Feature
When adding a new "products" feature:
```
src/
├── constants/
│   └── queryKeys.ts         # Add productsQueryKeys
├── types/
│   └── product.ts           # Product, ProductCreateInput, etc.
├── actions/
│   └── products.ts          # productsApi with typed methods
├── hooks/
│   └── useProducts.ts       # Custom React Query hooks
├── components/
│   └── products/
│       ├── ProductList.tsx
│       ├── ProductForm.tsx
│       └── ProductDetail.tsx
└── app/
    └── products/
        ├── page.tsx         # Products list page
        ├── [id]/
        │   └── page.tsx     # Product detail page
        └── new/
            └── page.tsx     # Create product page
```

### Adding a New API Endpoint
1. **Search Context7 for existing Fastify plugins** that might handle this functionality
2. **Fetch Context7 documentation** for all plugins you'll use
3. Create route file in `backend/src/routes/` using plugin features
4. Register route in `backend/src/server.ts`
5. Use `@fastify/type-provider-zod` for schema validation
6. Add schema definitions for Swagger documentation
7. Update frontend/mobile API clients in respective `api.ts` files

### Common Fastify Plugin Combinations (Use These!)
```typescript
// Authentication + Authorization Setup
import fastifyJwt from '@fastify/jwt'
import fastifyAuth from '@fastify/auth'
import fastifyBearerAuth from '@fastify/bearer-auth'

// Validation + Documentation Setup
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { fastifyTypeProviderZod } from '@fastify/type-provider-zod'

// Security Setup
import fastifyCors from '@fastify/cors'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifyHelmet from '@fastify/helmet'
import fastifyCsrf from '@fastify/csrf-protection'

// Performance Setup
import fastifyCompress from '@fastify/compress'
import fastifyCaching from '@fastify/caching'
import fastifyEtag from '@fastify/etag'

// Database Setup
import fastifyMongodb from '@fastify/mongodb'
import fastifyPostgres from '@fastify/postgres'
import fastifyRedis from '@fastify/redis'

// File Handling Setup
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import fastifyFileUpload from '@fastify/file-upload'
```

### Backend Feature Implementation Checklist
Before implementing ANY backend feature:
- [ ] Search Context7 for "[feature] fastify plugin"
- [ ] Search Context7 for "[feature] npm package"
- [ ] Check if combination of existing plugins can achieve the goal
- [ ] Only write custom code if absolutely necessary
- [ ] Document why custom code was needed (no package existed)

### Modifying Database Schema
1. Edit `backend/prisma/schema.prisma`
2. Run `npm run prisma:migrate` to create migration
3. Run `npm run prisma:generate` to update client
4. Restart backend server to apply changes

### Testing API Changes
- Use Swagger UI at http://localhost:3000/docs for interactive testing
- Backend logs SQL queries in development mode
- Check Prisma Studio (`npm run prisma:studio`) for database state

## Port Conflicts Resolution
```bash
# Find and kill processes
lsof -ti:3000 | xargs kill -9    # Backend
lsof -ti:3001 | xargs kill -9    # Frontend
```

## Mobile Testing Configuration
- **iOS Simulator**: Use `http://localhost:3000/api`
- **Android Emulator**: Use `http://10.0.2.2:3000/api`
- **Physical Device**: Use machine's IP address (find with `ifconfig` or `ipconfig`)

## Production Build Process

### Backend
```bash
npm run build                     # Compile TypeScript
npm run start                     # Start production server
```

### Frontend
```bash
npm run build                     # Next.js production build
npm run start                     # Serve production build
```

### Mobile
```bash
expo build:ios                    # iOS production build
expo build:android                # Android production build
```