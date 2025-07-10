#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
  echo -e "${BLUE}[SHULA]${NC} $1"
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

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
  print_message "Checking prerequisites..."
  
  # Check Node.js
  if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
  fi
  
  # Check npm
  if ! command_exists npm; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
  fi
  
  # Check Docker
  if ! command_exists docker; then
    print_error "Docker is not installed. Please install Docker and try again."
    exit 1
  fi
  
  # Check Docker Compose
  if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
  fi
  
  print_success "All prerequisites are installed."
}

# Install dependencies
install_dependencies() {
  print_message "Installing dependencies..."
  npm install
  print_success "Dependencies installed successfully."
}

# Start infrastructure
start_infrastructure() {
  print_message "Starting infrastructure (PostgreSQL and Redis)..."
  npm run dev:infra
  
  # Wait for infrastructure to be ready
  print_message "Waiting for infrastructure to be ready..."
  sleep 5
  print_success "Infrastructure is ready."
}

# Setup database
setup_database() {
  print_message "Setting up database..."
  npm run db:generate
  npm run db:migrate
  print_success "Database setup completed."
}

# Build shared packages
build_shared_packages() {
  print_message "Building shared packages..."
  npm run build:shared
  print_success "Shared packages built successfully."
}

# Main function
main() {
  print_message "🚀 Starting Shula development setup..."
  
  check_prerequisites
  install_dependencies
  start_infrastructure
  setup_database
  build_shared_packages
  
  print_success "✅ Shula development setup completed successfully!"
  print_message "You can now start the application with: ${GREEN}npm run dev:all${NC}"
  print_message "Or run individual services:"
  print_message "  - Backend: ${GREEN}npm run dev:backend${NC}"
  print_message "  - WhatsApp Container: ${GREEN}npm run dev:whatsapp${NC}"
  print_message "For more commands, check the README.md file."
}

# Run the main function
main 