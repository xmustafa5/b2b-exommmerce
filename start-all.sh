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
        return 1
    fi
    return 0
}

# Check ports before starting
echo -e "${YELLOW}Checking ports...${NC}"
check_port 3000 || { echo -e "${RED}Backend port 3000 is in use. Please stop the existing service.${NC}"; }
check_port 3001 || { echo -e "${RED}Frontend port 3001 is in use. Please stop the existing service.${NC}"; }
check_port 8081 || { echo -e "${RED}Mobile port 8081 is in use. Please stop the existing service.${NC}"; }

# Start Backend
echo -e "\n${GREEN}1. Starting Backend (Port 3000)...${NC}"
cd /home/mus/Documents/lilium/lilium/backend
npm run dev &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 3

# Start Frontend
echo -e "\n${GREEN}2. Starting Frontend (Port 3001)...${NC}"
cd /home/mus/Documents/lilium/lilium/frontend
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

# Wait a bit for frontend to start
sleep 3

# Start Mobile
echo -e "\n${GREEN}3. Starting Mobile App (Port 8081)...${NC}"
cd /home/mus/Documents/lilium/lilium/mobile
npm start &
MOBILE_PID=$!
echo "   Mobile PID: $MOBILE_PID"

echo -e "\n${GREEN}=================================="
echo "All services started successfully!"
echo "=================================="
echo ""
echo "Access URLs:"
echo "  Backend API:  http://localhost:3000"
echo "  Swagger Docs: http://localhost:3000/docs"
echo "  Frontend:     http://localhost:3001"
echo "  Mobile:       http://localhost:8081"
echo ""
echo "Test Credentials:"
echo "  Admin:         admin@b2b-platform.com / Admin@123"
echo "  Location Admin: location.admin@b2b-platform.com / LocationAdmin@123"
echo "  Shop Owner:    shop1@b2b-platform.com / ShopOwner@123"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo "=================================="

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping all services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    kill $MOBILE_PID 2>/dev/null
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Keep script running
wait