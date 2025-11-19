#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}  Starting All Services (WEB)${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}Warning: Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Check ports
echo -e "${YELLOW}Checking ports...${NC}"
check_port 3000 || echo -e "${RED}Backend port (3000) is in use. Killing process...${NC}" && lsof -ti:3000 | xargs kill -9 2>/dev/null
check_port 3001 || echo -e "${RED}Frontend port (3001) is in use. Killing process...${NC}" && lsof -ti:3001 | xargs kill -9 2>/dev/null
check_port 8081 || echo -e "${RED}Mobile web port (8081) is in use. Killing process...${NC}" && lsof -ti:8081 | xargs kill -9 2>/dev/null
sleep 2

# Start Backend
echo -e "${GREEN}Starting Backend (Port 3000)...${NC}"
cd /home/mus/Documents/lilium/lilium/backend
npm run dev > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${BLUE}Backend PID: $BACKEND_PID${NC}"

# Wait a bit for backend to start
sleep 3

# Start Frontend
echo -e "${GREEN}Starting Frontend (Port 3001)...${NC}"
cd /home/mus/Documents/lilium/lilium/frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${BLUE}Frontend PID: $FRONTEND_PID${NC}"

# Start Mobile Web
echo -e "${GREEN}Starting Mobile Web (Port 8081)...${NC}"
cd /home/mus/Documents/lilium/lilium/mobile
npm run web > /tmp/mobile.log 2>&1 &
MOBILE_PID=$!
echo -e "${BLUE}Mobile Web PID: $MOBILE_PID${NC}"

echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}  All Services Started!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "${BLUE}Services running:${NC}"
echo -e "  ${YELLOW}Backend:${NC}    http://localhost:3000 (PID: $BACKEND_PID)"
echo -e "  ${YELLOW}Frontend:${NC}   http://localhost:3001 (PID: $FRONTEND_PID)"
echo -e "  ${YELLOW}Mobile Web:${NC} http://localhost:8081 (PID: $MOBILE_PID)"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo -e "  ${YELLOW}Backend:${NC}    tail -f /tmp/backend.log"
echo -e "  ${YELLOW}Frontend:${NC}   tail -f /tmp/frontend.log"
echo -e "  ${YELLOW}Mobile:${NC}     tail -f /tmp/mobile.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Save PIDs to file for stop script
echo "$BACKEND_PID" > /tmp/backend.pid
echo "$FRONTEND_PID" > /tmp/frontend.pid
echo "$MOBILE_PID" > /tmp/mobile.pid

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${RED}Stopping all services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    kill $MOBILE_PID 2>/dev/null
    echo -e "${GREEN}All services stopped${NC}"
    rm -f /tmp/backend.pid /tmp/frontend.pid /tmp/mobile.pid
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for all background processes
wait
