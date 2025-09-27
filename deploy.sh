#!/bin/bash

# Temple Management System - Vercel Deployment Script
# This script automates the deployment process to Vercel

set -e  # Exit on any error

echo "🏛️  Temple Management System - Vercel Deployment"
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

# Check if Vercel CLI is installed
check_vercel_cli() {
    print_status "Checking Vercel CLI installation..."
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed!"
        print_status "Installing Vercel CLI..."
        npm install -g vercel
        print_success "Vercel CLI installed successfully!"
    else
        print_success "Vercel CLI is already installed!"
    fi
}

# Check if user is logged in to Vercel
check_vercel_login() {
    print_status "Checking Vercel login status..."
    
    if ! vercel whoami &> /dev/null; then
        print_warning "Not logged in to Vercel!"
        print_status "Please login to Vercel..."
        vercel login
    else
        print_success "Already logged in to Vercel!"
    fi
}

# Check if Git repository is initialized
check_git_repo() {
    print_status "Checking Git repository..."
    
    if [ ! -d ".git" ]; then
        print_warning "Git repository not initialized!"
        print_status "Initializing Git repository..."
        git init
        git add .
        git commit -m "Initial commit - Temple Management System"
        print_success "Git repository initialized!"
    else
        print_success "Git repository found!"
    fi
}

# Check if environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
        print_warning "Environment variables not set!"
        print_status "Please set the following environment variables:"
        echo "  export VITE_SUPABASE_URL='your_supabase_url'"
        echo "  export VITE_SUPABASE_ANON_KEY='your_supabase_anon_key'"
        echo ""
        print_status "You can also set them in the Vercel dashboard after deployment."
    else
        print_success "Environment variables are set!"
    fi
}

# Build the project
build_project() {
    print_status "Building the project..."
    
    if npm run build; then
        print_success "Project built successfully!"
    else
        print_error "Build failed! Please check the errors above."
        exit 1
    fi
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    if vercel --prod; then
        print_success "Deployment successful!"
        print_status "Your temple management system is now live!"
    else
        print_error "Deployment failed! Please check the errors above."
        exit 1
    fi
}

# Main deployment process
main() {
    echo ""
    print_status "Starting deployment process..."
    echo ""
    
    # Run all checks and deployment steps
    check_vercel_cli
    check_vercel_login
    check_git_repo
    check_env_vars
    build_project
    deploy_to_vercel
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    print_status "Next steps:"
    echo "  1. Go to https://vercel.com/dashboard"
    echo "  2. Find your project and click on it"
    echo "  3. Go to Settings → Environment Variables"
    echo "  4. Add your Supabase environment variables if not already set"
    echo "  5. Redeploy if needed: vercel --prod"
    echo ""
    print_status "Your temple management system is ready for your community! 🏛️"
}

# Run the main function
main
