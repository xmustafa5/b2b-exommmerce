#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}=================================${NC}"
echo -e "${RED}  Stopping All Services${NC}"
echo -e "${RED}=================================${NC}"
echo ""

# Function to kill process on port
kill_port() {
    local port=$1
    local name=$2

    if lsof -ti:$port >/dev/null 2>&1; then
        echo -e "${YELLOW}Stopping $name (port $port)...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✓ $name stopped${NC}"
    else
        echo -e "${BLUE}ℹ $name is not running${NC}"
    fi
}

# Kill by port
kill_port 3000 "Backend"
kill_port 3001 "Frontend"
kill_port 8081 "Mobile Web"
kill_port 19000 "Expo Dev Tools"
kill_port 19001 "Expo Metro"
kill_port 19002 "Expo Web"

# Clean up PID files
rm -f /tmp/backend.pid /tmp/frontend.pid /tmp/mobile.pid

# Clean up log files (optional)
# rm -f /tmp/backend.log /tmp/frontend.log /tmp/mobile.log

echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}  All Services Stopped!${NC}"
echo -e "${GREEN}=================================${NC}"
