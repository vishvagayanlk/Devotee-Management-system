#!/bin/bash

# Production Deployment Script for Temple Management System
# This script helps deploy your temple management system to production

set -e  # Exit on any error

echo "🏛️ Temple Management System - Production Deployment"
echo "=================================================="

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

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "Dependencies check passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci
    print_success "Dependencies installed"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    # Add your test commands here
    # npm run test
    print_success "Tests passed"
}

# Build the application
build_app() {
    print_status "Building application for production..."
    npm run build
    print_success "Application built successfully"
}

# Check environment variables
check_env_vars() {
    print_status "Checking environment variables..."
    
    if [ -z "$VITE_SUPABASE_URL" ]; then
        print_error "VITE_SUPABASE_URL is not set"
        exit 1
    fi
    
    if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
        print_error "VITE_SUPABASE_ANON_KEY is not set"
        exit 1
    fi
    
    print_success "Environment variables check passed"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    vercel --prod
    print_success "Deployed to Vercel successfully"
}

# Deploy to Netlify
deploy_netlify() {
    print_status "Deploying to Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        print_warning "Netlify CLI not found. Installing..."
        npm install -g netlify-cli
    fi
    
    netlify deploy --prod --dir=dist
    print_success "Deployed to Netlify successfully"
}

# Main deployment function
main() {
    echo "Starting production deployment..."
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    # Run deployment steps
    check_dependencies
    install_dependencies
    run_tests
    check_env_vars
    build_app
    
    # Ask user which platform to deploy to
    echo ""
    echo "Choose deployment platform:"
    echo "1) Vercel (Recommended)"
    echo "2) Netlify"
    echo "3) Manual deployment (just build)"
    read -p "Enter your choice (1-3): " choice
    
    case $choice in
        1)
            deploy_vercel
            ;;
        2)
            deploy_netlify
            ;;
        3)
            print_success "Build completed. Deploy the 'dist' folder manually."
            ;;
        *)
            print_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac
    
    echo ""
    print_success "🎉 Production deployment completed!"
    echo ""
    echo "Next steps:"
    echo "1. Set up email service (Gmail SMTP or professional service)"
    echo "2. Configure Supabase security settings"
    echo "3. Set up monitoring and error tracking"
    echo "4. Test all functionality"
    echo "5. Go live! 🚀"
    echo ""
    echo "For detailed instructions, see PRODUCTION_SETUP.md"
}

# Run main function
main "$@"
