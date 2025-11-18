#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting B2B Platform Services...${NC}"
echo "=================================="

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}Warning: Port $1 is already in use${NC}"
        echo -e "${RED}Killing process on port $1...${NC}"
        lsof -ti:$1 | xargs kill -9 2>/dev/null
        sleep 1
    fi
    return 0
}

# Check and clear ports before starting
echo -e "${YELLOW}Checking and clearing ports...${NC}"
check_port 3000
check_port 3001
check_port 8081
check_port 19000

# Start Backend
echo -e "\n${GREEN}1. Starting Backend (Port 3000)...${NC}"
cd /home/mus/Documents/lilium/lilium/backend
npm run dev &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start Frontend
echo -e "\n${GREEN}2. Starting Frontend (Port 3001)...${NC}"
cd /home/mus/Documents/lilium/lilium/frontend
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 3

echo -e "\n${GREEN}=================================="
echo "Backend and Frontend started!"
echo "=================================="
echo ""
echo "Access URLs:"
echo "  Backend API:  http://localhost:3000"
echo "  Swagger Docs: http://localhost:3000/docs"
echo "  Frontend:     http://localhost:3001"
echo ""
echo "Test Credentials:"
echo "  Admin:         admin@b2b-platform.com / Admin@123"
echo "  Location Admin: location.admin@b2b-platform.com / LocationAdmin@123"
echo "  Shop Owner:    shop1@b2b-platform.com / ShopOwner@123"
echo ""
echo -e "${GREEN}=================================="
echo "Starting Mobile App with QR Code..."
echo "==================================${NC}"
echo ""

# Start Mobile in foreground so QR code is visible
cd /home/mus/Documents/lilium/lilium/mobile
npm start

# This will only execute when mobile app is stopped
echo -e "\n${YELLOW}Mobile app stopped. Stopping other services...${NC}"
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
echo -e "${GREEN}All services stopped.${NC}"