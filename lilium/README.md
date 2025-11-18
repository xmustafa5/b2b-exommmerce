# Lilium - Full Stack Application

A modern full-stack application with backend API, web frontend, and mobile app.

## Project Structure

```
lilium/
├── backend/    # Node.js + Fastify + Prisma backend
├── frontend/   # Next.js web application
└── mobile/     # React Native mobile app (Expo)
```

## Tech Stack Overview

### Backend
- Node.js + TypeScript
- Fastify (Web framework)
- Prisma (ORM)
- PostgreSQL (Database)
- JWT Authentication
- Swagger API Documentation

### Frontend (Web)
- Next.js 14 (React framework)
- TypeScript
- Tailwind CSS
- React Query + Zustand
- React Hook Form + Zod

### Mobile
- React Native + Expo
- TypeScript
- React Query + Zustand
- AsyncStorage
- Cross-platform (iOS & Android)

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- PostgreSQL database (or use Prisma Postgres for local development)

### Installation

1. Clone the repository:
```bash
cd lilium
```

2. Install dependencies for all projects:

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

**Mobile:**
```bash
cd ../mobile
npm install
```

### Running the Applications

#### 1. Start Backend (Port 3000)
```bash
cd backend
npm run dev
```

Access:
- API: http://localhost:3000
- Swagger Docs: http://localhost:3000/docs
- Health Check: http://localhost:3000/api/health

#### 2. Start Frontend (Port 3001)
```bash
cd frontend
npm run dev
```

Access: http://localhost:3001

#### 3. Start Mobile
```bash
cd mobile
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app for physical device

## Database Setup

### Option 1: Prisma Postgres (Local Development)
```bash
cd backend
npm run prisma:dev       # Start local Prisma Postgres
npm run prisma:migrate    # Run migrations
npm run prisma:studio     # Open Prisma Studio GUI
```

### Option 2: PostgreSQL
1. Update `DATABASE_URL` in `backend/.env`
2. Run migrations:
```bash
cd backend
npm run prisma:migrate
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### Users (Protected)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Health
- `GET /api/health` - API health check

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=<your-database-url>
JWT_SECRET=<your-jwt-secret>
FRONTEND_URL=http://localhost:3001
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### Mobile (src/services/api.ts)
Update `API_BASE_URL` based on your testing environment:
- iOS Simulator: `http://localhost:3000/api`
- Android Emulator: `http://10.0.2.2:3000/api`
- Physical Device: `http://YOUR_LOCAL_IP:3000/api`

## Development Workflow

1. **Backend First**: Always start the backend server first
2. **Database**: Ensure database is running and migrated
3. **Frontend/Mobile**: Start after backend is ready

## Features

- 🔐 JWT-based authentication
- 📱 Cross-platform mobile support
- 🌐 Server-side rendering (Next.js)
- 📊 Type-safe database queries (Prisma)
- 📝 API documentation (Swagger)
- 🔄 Real-time data synchronization
- 💾 Persistent authentication
- 🎨 Responsive design
- 🔍 Form validation
- ⚡ Hot module replacement

## Scripts Reference

### Backend
- `npm run dev` - Development server with hot-reload
- `npm run build` - Build TypeScript
- `npm run start` - Production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:studio` - Prisma Studio GUI

### Frontend
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - Run ESLint

### Mobile
- `npm start` - Expo development server
- `npm run android` - Android emulator
- `npm run ios` - iOS simulator
- `npm run web` - Web browser

## Testing

### API Testing
Use the Swagger UI at http://localhost:3000/docs to test API endpoints interactively.

### Mobile Testing
1. Install Expo Go app on your phone
2. Ensure phone and development machine are on same network
3. Scan QR code from Expo Dev Tools

## Production Deployment

### Backend
1. Set production environment variables
2. Build: `npm run build`
3. Start: `npm run start`

### Frontend
1. Build: `npm run build`
2. Start: `npm run start`
3. Or deploy to Vercel/Netlify

### Mobile
1. Build for iOS: `expo build:ios`
2. Build for Android: `expo build:android`
3. Submit to app stores

## Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:3001 | xargs kill -9  # Frontend
```

**Database Connection Failed**
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Try `npm run prisma:dev` for local development

**Mobile API Connection**
- Check API_BASE_URL configuration
- Ensure backend is running
- Verify network connectivity

## Security Notes

⚠️ **Important for Production:**
- Change all default secrets and keys
- Use HTTPS in production
- Implement rate limiting
- Add input validation
- Enable CORS properly
- Use environment variables for sensitive data

## License

MIT

## Support

For issues and questions, please check the individual README files in each project directory.