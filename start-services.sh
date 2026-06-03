#!/bin/bash

# Pneumonia Diagnosis System - Linux/macOS Startup Script
# This script starts all required services in the correct order

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
AI_SERVICE_DIR="$SCRIPT_DIR/ai-service"
BACKEND_DIR="$SCRIPT_DIR/backend"

AI_SERVICE_PORT=8000
BACKEND_PORT=8090
FRONTEND_PORT=5173

# Process IDs for cleanup
AI_SERVICE_PID=""
BACKEND_PID=""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${BLUE}Shutting down services...${NC}"
    
    if [ -n "$AI_SERVICE_PID" ]; then
        echo -e "  ${BLUE}Stopping AI Service (PID: $AI_SERVICE_PID)...${NC}"
        if kill $AI_SERVICE_PID 2>/dev/null; then
            sleep 2
            kill -9 $AI_SERVICE_PID 2>/dev/null || true
            echo -e "  ${GREEN}✅ AI Service stopped${NC}"
        fi
    fi
    
    if [ -n "$BACKEND_PID" ]; then
        echo -e "  ${BLUE}Stopping Backend (PID: $BACKEND_PID)...${NC}"
        if kill $BACKEND_PID 2>/dev/null; then
            sleep 2
            kill -9 $BACKEND_PID 2>/dev/null || true
            echo -e "  ${GREEN}✅ Backend stopped${NC}"
        fi
    fi
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set trap for Ctrl+C
trap cleanup SIGINT SIGTERM

# Functions
print_banner() {
    echo -e "\n${BLUE}================================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================================================${NC}\n"
}

check_port() {
    local port=$1
    if nc -z 127.0.0.1 $port 2>/dev/null; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

stop_process_on_port() {
    local port=$1
    local pid
    pid=$(lsof -ti tcp:$port 2>/dev/null || true)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}⚠️  Stopping process(es) on port $port: $pid${NC}"
        kill $pid 2>/dev/null || true
        sleep 2
    fi
}

wait_for_service() {
    local url=$1
    local name=$2
    local timeout=${3:-60}
    
    echo -e "${BLUE}⏳ Waiting for $name to start (timeout: ${timeout}s)...${NC}"
    
    local start_time=$(date +%s)
    
    while true; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is running on $url${NC}"
            return 0
        fi
        
        local current_time=$(date +%s)
        if [ $((current_time - start_time)) -gt $timeout ]; then
            echo -e "${RED}❌ $name failed to start within ${timeout}s${NC}"
            return 1
        fi
        
        sleep 2
    done
}

# Verify directories exist
if [ ! -d "$AI_SERVICE_DIR" ]; then
    echo -e "${RED}❌ AI service directory not found: $AI_SERVICE_DIR${NC}"
    exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ Backend directory not found: $BACKEND_DIR${NC}"
    exit 1
fi

# Start banner
print_banner "PNEUMONIA DIAGNOSIS SYSTEM - SERVICE STARTUP (Linux/macOS)"

# Check port availability
echo -e "${BLUE}Checking port availability...${NC}"

if check_port $AI_SERVICE_PORT; then
    echo -e "${YELLOW}⚠️  Port $AI_SERVICE_PORT is already in use${NC}"
    echo -e "${YELLOW}   AI Service will try to use alternative port (8001, 8002, etc.)${NC}"
fi

if check_port $BACKEND_PORT; then
    echo -e "${YELLOW}⚠️  Port $BACKEND_PORT is already in use${NC}"
    echo -e "${YELLOW}   Attempting to free the port before starting Backend...${NC}"
    stop_process_on_port $BACKEND_PORT
fi

# Start AI Service
print_banner "STARTING AI SERVICE"

MAIN_PY="$AI_SERVICE_DIR/main.py"
if [ ! -f "$MAIN_PY" ]; then
    echo -e "${RED}❌ main.py not found: $MAIN_PY${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 Starting AI Service from: $MAIN_PY${NC}"
echo -e "${BLUE}   Directory: $AI_SERVICE_DIR${NC}"

export PYTHONUNBUFFERED=1
export PORT=8000
export HOST=0.0.0.0

cd "$AI_SERVICE_DIR"
python3 main.py > ai-service.log 2>&1 &
AI_SERVICE_PID=$!

echo -e "${GREEN}✅ AI Service process started (PID: $AI_SERVICE_PID)${NC}"

# Give it a moment to start
sleep 3

# Check if process is still alive
if ! kill -0 $AI_SERVICE_PID 2>/dev/null; then
    echo -e "${RED}❌ AI Service process died immediately!${NC}"
    tail -50 ai-service.log
    exit 1
fi

echo -e "${GREEN}✅ AI Service process is running${NC}"

# Wait for AI Service to be ready
if ! wait_for_service "http://localhost:8000/health" "AI Service"; then
    echo -e "${YELLOW}⚠️  AI Service health check failed - continuing anyway${NC}"
fi

cd "$SCRIPT_DIR"

# Start Backend
print_banner "STARTING BACKEND"

POM_XML="$BACKEND_DIR/pom.xml"
if [ ! -f "$POM_XML" ]; then
    echo -e "${RED}❌ pom.xml not found: $POM_XML${NC}"
    kill $AI_SERVICE_PID 2>/dev/null || true
    exit 1
fi

MVNW="$BACKEND_DIR/mvnw"
if [ ! -f "$MVNW" ]; then
    echo -e "${RED}❌ mvnw not found: $MVNW${NC}"
    kill $AI_SERVICE_PID 2>/dev/null || true
    exit 1
fi

chmod +x "$MVNW"

echo -e "${BLUE}🚀 Starting Backend with Maven...${NC}"
echo -e "${BLUE}   Directory: $BACKEND_DIR${NC}"
echo -e "${BLUE}   Command: $MVNW spring-boot:run${NC}"

cd "$BACKEND_DIR"
"$MVNW" spring-boot:run > backend.log 2>&1 &
BACKEND_PID=$!

echo -e "${GREEN}✅ Backend process started (PID: $BACKEND_PID)${NC}"

# Give it more time since Maven needs to download dependencies
sleep 5

if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend process died immediately!${NC}"
    tail -50 backend.log
else
    echo -e "${GREEN}✅ Backend process is running${NC}"
fi

# Wait for Backend to be ready
if ! wait_for_service "http://localhost:8090" "Backend" 120; then
    echo -e "${YELLOW}⚠️  Backend health check failed - it may still be starting${NC}"
fi

cd "$SCRIPT_DIR"

# Final summary
print_banner "✅ STARTUP COMPLETE"

echo -e "${BLUE}🌐 Access points:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:$BACKEND_PORT${NC}"
echo -e "   AI Service: ${GREEN}http://localhost:$AI_SERVICE_PORT${NC}"

echo ""
echo -e "${BLUE}📊 Health checks:${NC}"
echo -e "   AI Health: ${GREEN}http://localhost:$AI_SERVICE_PORT/health${NC}"
echo -e "   AI Status: ${GREEN}http://localhost:$AI_SERVICE_PORT/status${NC}"

echo ""
echo -e "${BLUE}📋 Process IDs:${NC}"
echo -e "   AI Service: ${GREEN}$AI_SERVICE_PID${NC}"
echo -e "   Backend: ${GREEN}$BACKEND_PID${NC}"

echo ""
echo -e "${YELLOW}! Both processes are running. Press Ctrl+C to stop all services.${NC}"
echo ""

# Keep script running and monitor processes
while true; do
    sleep 5
    
    if ! kill -0 $AI_SERVICE_PID 2>/dev/null; then
        echo -e "${RED}❌ AI Service process died${NC}"
    fi
    
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend process died${NC}"
    fi
done
