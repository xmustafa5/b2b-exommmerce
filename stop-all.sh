#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Stopping all B2B Platform services...${NC}"

# Kill processes on specific ports
echo "Stopping Backend on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "  Backend not running"

echo "Stopping Frontend on port 3001..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || echo "  Frontend not running"

echo "Stopping Mobile on port 8081..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || echo "  Mobile not running"

# Also kill Metro bundler port
echo "Stopping Metro bundler on port 19000..."
lsof -ti:19000 | xargs kill -9 2>/dev/null || echo "  Metro bundler not running"

echo -e "${GREEN}All services stopped successfully!${NC}"