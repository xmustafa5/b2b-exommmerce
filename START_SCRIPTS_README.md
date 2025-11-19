# 🚀 Start Scripts - Quick Guide

## Available Scripts

### 1. **start-all-web.sh** - Start All Services (Web Version)
Starts Backend + Frontend + Mobile Web in one command

### 2. **stop-all-web.sh** - Stop All Services
Stops all running services

---

## Usage

### Start All Services

```bash
cd /home/mus/Documents/lilium
./start-all-web.sh
```

**What it does:**
- ✅ Kills any existing processes on ports 3000, 3001, 8081
- ✅ Starts Backend on `http://localhost:3000`
- ✅ Starts Frontend on `http://localhost:3001`
- ✅ Starts Mobile Web on `http://localhost:8081`
- ✅ Shows all PIDs and URLs
- ✅ Saves logs to `/tmp/*.log`

**Output Example:**
```
=================================
  Starting All Services (WEB)
=================================

Checking ports...
Starting Backend (Port 3000)...
Backend PID: 12345
Starting Frontend (Port 3001)...
Frontend PID: 12346
Starting Mobile Web (Port 8081)...
Mobile Web PID: 12347

=================================
  All Services Started!
=================================

Services running:
  Backend:    http://localhost:3000 (PID: 12345)
  Frontend:   http://localhost:3001 (PID: 12346)
  Mobile Web: http://localhost:8081 (PID: 12347)

Logs:
  Backend:    tail -f /tmp/backend.log
  Frontend:   tail -f /tmp/frontend.log
  Mobile:     tail -f /tmp/mobile.log

Press Ctrl+C to stop all services
```

---

### Stop All Services

```bash
cd /home/mus/Documents/lilium
./stop-all-web.sh
```

**What it does:**
- ✅ Stops Backend (port 3000)
- ✅ Stops Frontend (port 3001)
- ✅ Stops Mobile Web (port 8081)
- ✅ Cleans up PID files
- ✅ Shows confirmation for each service

---

## View Logs

While services are running, you can view logs in real-time:

```bash
# Backend logs
tail -f /tmp/backend.log

# Frontend logs
tail -f /tmp/frontend.log

# Mobile logs
tail -f /tmp/mobile.log

# All logs together
tail -f /tmp/backend.log /tmp/frontend.log /tmp/mobile.log
```

---

## Access Points

After starting with `./start-all-web.sh`:

| Service | URL | Description |
|---------|-----|-------------|
| **Backend** | http://localhost:3000 | API Server |
| **API Docs** | http://localhost:3000/docs | Swagger UI |
| **Frontend** | http://localhost:3001 | Admin Dashboard (Next.js) |
| **Mobile Web** | http://localhost:8081 | Mobile App (Expo Web) |

---

## Troubleshooting

### Ports Already in Use

If you see "Port is already in use", the script will automatically kill the existing process. If that doesn't work:

```bash
# Manually kill processes
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:3001 | xargs kill -9  # Frontend
lsof -ti:8081 | xargs kill -9  # Mobile
```

### Services Not Starting

1. **Check logs:**
   ```bash
   cat /tmp/backend.log
   cat /tmp/frontend.log
   cat /tmp/mobile.log
   ```

2. **Check if dependencies are installed:**
   ```bash
   cd lilium/backend && npm install
   cd ../frontend && npm install
   cd ../mobile && npm install
   ```

3. **Try starting individually:**
   ```bash
   # Backend
   cd lilium/backend && npm run dev

   # Frontend
   cd lilium/frontend && npm run dev

   # Mobile
   cd lilium/mobile && npm run web
   ```

### Stop Script Doesn't Work

Use the manual stop method:

```bash
# Kill all Node processes (USE WITH CAUTION)
pkill -f node

# Or kill specific ports
lsof -ti:3000,3001,8081 | xargs kill -9
```

---

## Quick Commands Reference

```bash
# Start everything
./start-all-web.sh

# Stop everything
./stop-all-web.sh

# View backend logs
tail -f /tmp/backend.log

# View frontend logs
tail -f /tmp/frontend.log

# View mobile logs
tail -f /tmp/mobile.log

# Check what's running on ports
lsof -i :3000,3001,8081

# Clear log files
rm /tmp/backend.log /tmp/frontend.log /tmp/mobile.log
```

---

## Stopping Services

### Method 1: Using Stop Script (Recommended)
```bash
./stop-all-web.sh
```

### Method 2: Ctrl+C in Start Script Terminal
If you started with `./start-all-web.sh`, just press `Ctrl+C` in that terminal

### Method 3: Manual Kill
```bash
# Kill by port
lsof -ti:3000 | xargs kill -9  # Backend
lsof -ti:3001 | xargs kill -9  # Frontend
lsof -ti:8081 | xargs kill -9  # Mobile

# Or kill by PID (if you saved them)
kill $(cat /tmp/backend.pid)
kill $(cat /tmp/frontend.pid)
kill $(cat /tmp/mobile.pid)
```

---

## Tips

1. **Always use the start script** - It handles port conflicts automatically
2. **Check logs** if something doesn't work - Logs are in `/tmp/`
3. **Use stop script** before starting again - Prevents port conflicts
4. **Keep terminal open** - Or run in background with `nohup`

---

## Running in Background (Optional)

If you want to run services in background and close terminal:

```bash
nohup ./start-all-web.sh &
```

To stop later:
```bash
./stop-all-web.sh
```

---

**Happy Developing! 🚀**
