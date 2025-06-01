#!/usr/bin/env bash

# AI Doctor Assistant - Local Setup Script
# This script sets up the development environment and starts all services

set -e  # Exit on any error

echo "🔄 Starting AI Doctor Assistant local setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js >=20.0.0"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "20" ]; then
    print_error "Node.js version must be >=20.0.0. Current version: $(node --version)"
    exit 1
fi

if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Run: npm install -g firebase-tools"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm"
    exit 1
fi

print_success "Prerequisites check passed"

# Install root dependencies
print_status "Installing root dependencies..."
npm install

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend && npm install && cd ..

# Install functions dependencies
print_status "Installing functions dependencies..."
cd functions && npm install && cd ..

# Build functions
print_status "Building Firebase Functions..."
cd functions && npm run build && cd ..

# Check if .runtimeconfig.json exists
if [ ! -f "functions/.runtimeconfig.json" ]; then
    print_warning ".runtimeconfig.json not found. Attempting to generate from Firebase config..."
    cd functions
    if firebase functions:config:get > .runtimeconfig.json 2>/dev/null; then
        print_success "Generated .runtimeconfig.json from Firebase config"
    else
        print_warning "Could not generate .runtimeconfig.json. Please set OpenAI API key:"
        print_warning "firebase functions:config:set openai.key=\"YOUR_API_KEY\""
        print_warning "cd functions && firebase functions:config:get > .runtimeconfig.json"
    fi
    cd ..
fi

# Kill any existing processes on Firebase ports
print_status "Cleaning up existing processes..."
lsof -ti:5001,8080,4000,4400,9199,5175 2>/dev/null | xargs kill -9 2>/dev/null || true

# Wait a moment for ports to be freed
sleep 2

# Start Firebase emulators in background
print_status "Starting Firebase emulators..."
firebase emulators:start --only functions,firestore,storage --project gressusapp &
EMULATOR_PID=$!

# Wait for emulators to start
print_status "Waiting for emulators to initialize..."
sleep 10

# Check if emulators are running
if ! curl -s http://127.0.0.1:5001 > /dev/null 2>&1; then
    print_error "Firebase emulators failed to start. Check the logs above."
    kill $EMULATOR_PID 2>/dev/null || true
    exit 1
fi

print_success "Firebase emulators started successfully"

# Start frontend development server
print_status "Starting frontend development server..."
npm --prefix frontend run dev -- --port 5175 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Check if frontend is running
if ! curl -s http://localhost:5175 > /dev/null 2>&1; then
    print_warning "Frontend might not be ready yet. It may take a few more seconds..."
fi

print_success "Setup completed successfully!"
echo ""
echo "🎉 AI Doctor Assistant is now running:"
echo "   Frontend: http://localhost:5175"
echo "   Firebase UI: http://127.0.0.1:4000"
echo "   Functions: http://127.0.0.1:5001"
echo ""
echo "📋 API Endpoints:"
echo "   POST http://127.0.0.1:5001/gressusapp/us-central1/transcribeAudio"
echo "   POST http://127.0.0.1:5001/gressusapp/us-central1/extractMedicalData"
echo "   POST http://127.0.0.1:5001/gressusapp/us-central1/generateDiagnosis"
echo ""
echo "🛑 To stop all services, press Ctrl+C or run:"
echo "   lsof -ti:5001,8080,4000,4400,9199,5175 | xargs kill -9"
echo ""

# Keep script running and handle cleanup on exit
cleanup() {
    print_status "Shutting down services..."
    kill $EMULATOR_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    lsof -ti:5001,8080,4000,4400,9199,5175 2>/dev/null | xargs kill -9 2>/dev/null || true
    print_success "All services stopped"
}

trap cleanup EXIT INT TERM

# Wait for user to stop
wait 