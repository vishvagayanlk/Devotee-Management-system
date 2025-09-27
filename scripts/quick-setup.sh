#!/bin/bash

# ==============================================
# Quick Temple Setup Script
# ==============================================
# This script provides a quick setup for temple management
# ==============================================

set -e  # Exit on any error

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

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
}

# Function to create .env file if it doesn't exist
create_env_file() {
    if [ ! -f ".env" ]; then
        print_status "Creating .env file template..."
        cat > .env << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Admin Management (Service Role Key - Keep Secret!)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Example:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EOF
        print_warning "Please edit .env file with your Supabase credentials"
        print_warning "Then run this script again"
        exit 1
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install @supabase/supabase-js dotenv
    print_success "Dependencies installed"
}

# Function to show setup instructions
show_instructions() {
    echo ""
    echo "=============================================="
    echo "🏛️  Temple Management Setup Instructions"
    echo "=============================================="
    echo ""
    echo "1. DATABASE MIGRATION (Required)"
    echo "   Go to your Supabase Dashboard → SQL Editor"
    echo "   Run these migrations in order:"
    echo ""
    echo "   a) Admin Management:"
    echo "      Copy and paste the content from:"
    echo "      supabase/migrations/20250127020000_add_admin_management.sql"
    echo ""
    echo "   b) Multi-Temple Support:"
    echo "      Copy and paste the content from:"
    echo "      supabase/migrations/20250127030000_add_multi_temple_support.sql"
    echo ""
    echo "2. ADMIN SETUP (Choose one)"
    echo ""
    echo "   Option A - Single Temple:"
    echo "   Copy and paste the content from:"
    echo "   run-admin-setup.sql"
    echo "   (Remember to change the admin details!)"
    echo ""
    echo "   Option B - Multi-Temple:"
    echo "   Copy and paste the content from:"
    echo "   multi-temple-setup.sql"
    echo ""
    echo "3. VERIFY SETUP"
    echo "   After running the SQL scripts, you can verify:"
    echo "   - Check that admin users were created"
    echo "   - Test login with new admin credentials"
    echo "   - Verify temple isolation (if using multi-temple)"
    echo ""
    echo "4. USAGE"
    echo "   - Use the Node.js scripts for ongoing management:"
    echo "     ./scripts/setup-admin.sh"
    echo "     ./scripts/run-sql.sh"
    echo ""
}

# Function to show SQL content
show_sql_content() {
    echo ""
    echo "=============================================="
    echo "📄 SQL Content for Supabase SQL Editor"
    echo "=============================================="
    echo ""
    echo "Choose which SQL to display:"
    echo "1. Admin Management Migration"
    echo "2. Multi-Temple Support Migration"
    echo "3. Single Temple Admin Setup"
    echo "4. Multi-Temple Setup Example"
    echo "5. Back to instructions"
    echo ""
    
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            if [ -f "supabase/migrations/20250127020000_add_admin_management.sql" ]; then
                echo ""
                echo "=== Copy this to Supabase SQL Editor ==="
                echo "=========================================="
                cat "supabase/migrations/20250127020000_add_admin_management.sql"
                echo ""
                echo "=========================================="
            else
                print_error "File not found"
            fi
            ;;
        2)
            if [ -f "supabase/migrations/20250127030000_add_multi_temple_support.sql" ]; then
                echo ""
                echo "=== Copy this to Supabase SQL Editor ==="
                echo "=========================================="
                cat "supabase/migrations/20250127030000_add_multi_temple_support.sql"
                echo ""
                echo "=========================================="
            else
                print_error "File not found"
            fi
            ;;
        3)
            if [ -f "run-admin-setup.sql" ]; then
                echo ""
                echo "=== Copy this to Supabase SQL Editor ==="
                echo "=========================================="
                cat "run-admin-setup.sql"
                echo ""
                echo "=========================================="
            else
                print_error "File not found"
            fi
            ;;
        4)
            if [ -f "multi-temple-setup.sql" ]; then
                echo ""
                echo "=== Copy this to Supabase SQL Editor ==="
                echo "=========================================="
                cat "multi-temple-setup.sql"
                echo ""
                echo "=========================================="
            else
                print_error "File not found"
            fi
            ;;
        5)
            show_instructions
            ;;
        *)
            print_error "Invalid option"
            show_sql_content
            ;;
    esac
}

# Function to make scripts executable
make_scripts_executable() {
    print_status "Making scripts executable..."
    chmod +x scripts/*.sh
    chmod +x scripts/*.js
    print_success "Scripts are now executable"
}

# Main function
main() {
    echo "🏛️  Quick Temple Setup Script"
    echo "=============================="
    echo ""
    
    # Check directory
    check_directory
    
    # Create .env file if needed
    create_env_file
    
    # Install dependencies
    install_dependencies
    
    # Make scripts executable
    make_scripts_executable
    
    # Show instructions
    show_instructions
    
    # Ask if user wants to see SQL content
    echo ""
    read -p "Would you like to see the SQL content to copy to Supabase? (y/n): " show_sql
    
    if [ "$show_sql" = "y" ] || [ "$show_sql" = "Y" ]; then
        show_sql_content
    fi
    
    print_success "Setup instructions completed!"
    print_status "Next steps:"
    print_status "1. Run the SQL migrations in Supabase"
    print_status "2. Set up your admin users"
    print_status "3. Test the system"
}

# Run main function
main "$@"
