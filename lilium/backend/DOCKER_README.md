# Docker Setup for Lilium Backend

This document provides instructions for running the Lilium backend using Docker.

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose 2.0+ installed
- At least 4GB of available RAM

## Quick Start

### Development Environment

```bash
# Start PostgreSQL and Redis for development
docker-compose -f docker-compose.dev.yml up -d

# The services will be available at:
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - PgAdmin: http://localhost:5050 (admin@lilium.com / admin)
# - RedisInsight: http://localhost:8001

# Run the backend locally with npm
npm run dev
```

### Production Environment

```bash
# Build and run all services
docker-compose up -d --build

# The backend will be available at: http://localhost:3000
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/b2b_platform?schema=public

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Redis (if using)
REDIS_URL=redis://localhost:6379

# Node Environment
NODE_ENV=development
PORT=3000
```

## Docker Commands

### Starting Services

```bash
# Start all services in detached mode
docker-compose up -d

# Start specific services
docker-compose up -d postgres redis

# View logs
docker-compose logs -f backend

# View logs for specific service
docker-compose logs -f postgres
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This will delete all data!)
docker-compose down -v
```

### Database Management

```bash
# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Open Prisma Studio
docker-compose exec backend npx prisma studio

# Access PostgreSQL CLI
docker-compose exec postgres psql -U postgres -d b2b_platform

# Backup database
docker-compose exec postgres pg_dump -U postgres b2b_platform > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres b2b_platform < backup.sql
```

### Troubleshooting

```bash
# Check service status
docker-compose ps

# Check service health
docker-compose exec backend node -e "console.log('Backend is healthy')"
docker-compose exec postgres pg_isready -U postgres
docker-compose exec redis redis-cli ping

# Rebuild backend image (after code changes)
docker-compose build backend
docker-compose up -d backend

# View resource usage
docker stats

# Clean up unused resources
docker system prune -a --volumes
```

## Docker Architecture

### Services

1. **postgres**: PostgreSQL 15 database
   - Port: 5432
   - Persistent volume for data
   - Health checks enabled

2. **redis**: Redis 7 cache server
   - Port: 6379
   - Persistent volume for data
   - AOF persistence enabled

3. **backend**: Node.js Fastify application
   - Port: 3000
   - Automatic migration on startup
   - Health endpoint at `/api/health`
   - Non-root user for security

### Networks

All services are connected via the `lilium-network` bridge network for internal communication.

### Volumes

- `postgres_data`: PostgreSQL data directory
- `redis_data`: Redis data directory
- `./uploads`: Shared upload directory

## Production Considerations

### Security

1. **Change default passwords** in production
2. **Use secrets management** for sensitive data
3. **Enable SSL/TLS** for database connections
4. **Use environment-specific .env files**
5. **Run containers with non-root users** (already configured)

### Performance

1. **Resource Limits**: Add resource constraints to services
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1024M
        reservations:
          cpus: '0.5'
          memory: 512M
```

2. **Scaling**: Use Docker Swarm or Kubernetes for production scaling

3. **Monitoring**: Add monitoring services like Prometheus and Grafana

### Backup Strategy

1. Set up automated database backups
2. Use volume backups for persistent data
3. Test restore procedures regularly

## Health Checks

The Docker configuration includes health checks for all services:

- **Backend**: HTTP check on `/api/health`
- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping` command

Services will automatically restart if health checks fail.

## Deployment

### Using Docker Hub

```bash
# Build and tag image
docker build -t yourusername/lilium-backend:latest .

# Push to Docker Hub
docker push yourusername/lilium-backend:latest

# Update docker-compose.yml to use the pushed image
# Replace 'build' section with:
# image: yourusername/lilium-backend:latest
```

### Using Private Registry

```bash
# Tag for private registry
docker tag lilium-backend:latest registry.company.com/lilium-backend:latest

# Push to private registry
docker push registry.company.com/lilium-backend:latest
```

## Support

For issues or questions about Docker setup:
1. Check container logs: `docker-compose logs`
2. Verify environment variables are set correctly
3. Ensure ports are not already in use
4. Check Docker daemon is running: `docker info`