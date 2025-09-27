#!/bin/bash

# ==============================================
# SQL Script Runner
# ==============================================
# This script helps you run SQL scripts for temple management
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

# Function to check if psql is available
check_psql() {
    if ! command -v psql &> /dev/null; then
        print_error "psql is not installed. Please install PostgreSQL client tools."
        print_warning "Alternatively, you can copy and paste the SQL scripts into Supabase SQL Editor."
        exit 1
    fi
}

# Function to get database connection details
get_db_connection() {
    print_status "Please provide your Supabase database connection details:"
    echo ""
    
    read -p "Database Host (e.g., db.xxxxx.supabase.co): " DB_HOST
    read -p "Database Port (default: 5432): " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    read -p "Database Name (e.g., postgres): " DB_NAME
    read -p "Username (e.g., postgres): " DB_USER
    read -s -p "Password: " DB_PASSWORD
    echo ""
    
    # Set connection string
    export PGPASSWORD="$DB_PASSWORD"
    export DB_CONNECTION="postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
}

# Function to run SQL file
run_sql_file() {
    local sql_file="$1"
    local description="$2"
    
    if [ ! -f "$sql_file" ]; then
        print_error "SQL file not found: $sql_file"
        return 1
    fi
    
    print_status "Running: $description"
    print_warning "File: $sql_file"
    
    if psql "$DB_CONNECTION" -f "$sql_file"; then
        print_success "Successfully executed: $description"
    else
        print_error "Failed to execute: $description"
        return 1
    fi
}

# Function to show available SQL scripts
show_scripts() {
    echo ""
    echo "=============================================="
    echo "📄 Available SQL Scripts"
    echo "=============================================="
    echo ""
    echo "1. Admin Management Migration"
    echo "   File: supabase/migrations/20250127020000_add_admin_management.sql"
    echo "   Description: Adds admin management functions"
    echo ""
    echo "2. Multi-Temple Support Migration"
    echo "   File: supabase/migrations/20250127030000_add_multi_temple_support.sql"
    echo "   Description: Adds multi-temple support with isolation"
    echo ""
    echo "3. Single Temple Admin Setup"
    echo "   File: run-admin-setup.sql"
    echo "   Description: Removes test admin and creates new admin"
    echo ""
    echo "4. Multi-Temple Setup Example"
    echo "   File: multi-temple-setup.sql"
    echo "   Description: Creates 3 example temples with admins"
    echo ""
    echo "5. Custom SQL Script"
    echo "   Description: Run your own SQL file"
    echo ""
}

# Function to handle menu selection
handle_menu() {
    while true; do
        show_scripts
        echo "Choose an option:"
        echo "1. Run Admin Management Migration"
        echo "2. Run Multi-Temple Support Migration"
        echo "3. Run Single Temple Admin Setup"
        echo "4. Run Multi-Temple Setup Example"
        echo "5. Run Custom SQL Script"
        echo "6. Show SQL content (copy to Supabase)"
        echo "7. Exit"
        echo ""
        
        read -p "Enter your choice (1-7): " choice
        
        case $choice in
            1)
                run_sql_file "supabase/migrations/20250127020000_add_admin_management.sql" "Admin Management Migration"
                break
                ;;
            2)
                run_sql_file "supabase/migrations/20250127030000_add_multi_temple_support.sql" "Multi-Temple Support Migration"
                break
                ;;
            3)
                run_sql_file "run-admin-setup.sql" "Single Temple Admin Setup"
                break
                ;;
            4)
                run_sql_file "multi-temple-setup.sql" "Multi-Temple Setup Example"
                break
                ;;
            5)
                read -p "Enter path to SQL file: " custom_file
                run_sql_file "$custom_file" "Custom SQL Script"
                break
                ;;
            6)
                show_sql_content
                break
                ;;
            7)
                print_status "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-7."
                ;;
        esac
    done
}

# Function to show SQL content for manual copying
show_sql_content() {
    echo ""
    echo "=============================================="
    echo "📋 SQL Content for Manual Copying"
    echo "=============================================="
    echo ""
    echo "Choose a script to display:"
    echo "1. Admin Management Migration"
    echo "2. Multi-Temple Support Migration"
    echo "3. Single Temple Admin Setup"
    echo "4. Multi-Temple Setup Example"
    echo "5. Back to main menu"
    echo ""
    
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            if [ -f "supabase/migrations/20250127020000_add_admin_management.sql" ]; then
                echo ""
                echo "=== Admin Management Migration ==="
                cat "supabase/migrations/20250127020000_add_admin_management.sql"
            else
                print_error "File not found"
            fi
            ;;
        2)
            if [ -f "supabase/migrations/20250127030000_add_multi_temple_support.sql" ]; then
                echo ""
                echo "=== Multi-Temple Support Migration ==="
                cat "supabase/migrations/20250127030000_add_multi_temple_support.sql"
            else
                print_error "File not found"
            fi
            ;;
        3)
            if [ -f "run-admin-setup.sql" ]; then
                echo ""
                echo "=== Single Temple Admin Setup ==="
                cat "run-admin-setup.sql"
            else
                print_error "File not found"
            fi
            ;;
        4)
            if [ -f "multi-temple-setup.sql" ]; then
                echo ""
                echo "=== Multi-Temple Setup Example ==="
                cat "multi-temple-setup.sql"
            else
                print_error "File not found"
            fi
            ;;
        5)
            handle_menu
            ;;
        *)
            print_error "Invalid option"
            show_sql_content
            ;;
    esac
}

# Main function
main() {
    echo "📄 SQL Script Runner"
    echo "===================="
    echo ""
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
    
    # Check if psql is available
    check_psql
    
    # Get database connection details
    get_db_connection
    
    # Show menu
    handle_menu
    
    print_success "SQL execution completed!"
}

# Run main function
main "$@"
