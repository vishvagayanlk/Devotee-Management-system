#!/bin/bash

# ==============================================
# Temple Management System Setup
# ==============================================
# Main setup script for temple management system
# ==============================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${PURPLE}==============================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}==============================================${NC}"
}

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

# Function to show main menu
show_main_menu() {
    clear
    print_header "🏛️  Temple Management System Setup"
    echo ""
    echo "Choose your setup option:"
    echo ""
    echo "1. 🚀 Quick Setup (Recommended for beginners)"
    echo "   - Shows step-by-step instructions"
    echo "   - Displays SQL content for copying"
    echo "   - Guides you through the process"
    echo ""
    echo "2. 🏛️  Single Temple Setup (Simple admin creation)"
    echo "   - Create single temple with admin"
    echo "   - Simple command-line setup"
    echo "   - Perfect for single temple management"
    echo ""
    echo "3. 🔧 Advanced Setup (Interactive)"
    echo "   - Interactive admin creation"
    echo "   - Manual configuration"
    echo "   - Full control over the process"
    echo ""
    echo "4. 📄 SQL Script Runner"
    echo "   - Run SQL scripts directly"
    echo "   - Database migration tools"
    echo "   - Custom SQL execution"
    echo ""
    echo "5. 📋 Show Instructions Only"
    echo "   - Display setup instructions"
    echo "   - Show SQL content for manual copying"
    echo "   - No interactive setup"
    echo ""
    echo "6. ❓ Help & Documentation"
    echo "   - View documentation files"
    echo "   - Show available scripts"
    echo "   - Get help with setup"
    echo ""
    echo "7. 🚪 Exit"
    echo ""
}

# Function to handle main menu selection
handle_main_menu() {
    while true; do
        show_main_menu
        read -p "Enter your choice (1-7): " choice
        
        case $choice in
            1)
                print_status "Starting Quick Setup..."
                ./scripts/quick-setup.sh
                break
                ;;
            2)
                print_status "Starting Single Temple Setup..."
                echo ""
                echo "🏛️  Single Temple Setup"
                echo "======================"
                echo ""
                echo "This will create a single temple with an admin user."
                echo ""
                read -p "Admin Email: " admin_email
                read -p "Admin Password: " admin_password
                read -p "Admin Name: " admin_name
                read -p "Temple Name (optional): " temple_name
                read -p "Temple Description (optional): " temple_description
                echo ""
                
                node scripts/setup-single-temple.js \
                    --admin-email="$admin_email" \
                    --admin-password="$admin_password" \
                    --admin-name="$admin_name" \
                    --temple-name="$temple_name" \
                    --temple-description="$temple_description"
                break
                ;;
            3)
                print_status "Starting Advanced Setup..."
                echo ""
                echo "🔧 Advanced Setup"
                echo "================="
                echo ""
                echo "This option is not available in single temple mode."
                echo "Please use 'Single Temple Setup' (option 2) instead."
                echo ""
                break
                ;;
            4)
                print_status "Starting SQL Script Runner..."
                ./scripts/run-sql.sh
                break
                ;;
            5)
                show_instructions_only
                break
                ;;
            6)
                show_help
                break
                ;;
            7)
                print_status "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-7."
                sleep 2
                ;;
        esac
    done
}

# Function to show instructions only
show_instructions_only() {
    clear
    print_header "📋 Setup Instructions"
    echo ""
    echo "1. DATABASE MIGRATION (Required)"
    echo "   Go to your Supabase Dashboard → SQL Editor"
    echo "   Run these migrations in order:"
    echo ""
    echo "   a) Admin Management:"
    echo "      File: supabase/migrations/20250127020000_add_admin_management.sql"
    echo ""
    echo "   b) Multi-Temple Support:"
    echo "      File: supabase/migrations/20250127030000_add_multi_temple_support.sql"
    echo ""
    echo "2. ADMIN SETUP (Choose one)"
    echo ""
    echo "   Option A - Single Temple:"
    echo "   File: run-admin-setup.sql"
    echo "   (Remember to change the admin details!)"
    echo ""
    echo "   Option B - Multi-Temple:"
    echo "   File: multi-temple-setup.sql"
    echo ""
    echo "3. VERIFY SETUP"
    echo "   - Check that admin users were created"
    echo "   - Test login with new admin credentials"
    echo "   - Verify temple isolation (if using multi-temple)"
    echo ""
    
    read -p "Press Enter to continue..."
}

# Function to show help and documentation
show_help() {
    clear
    print_header "❓ Help & Documentation"
    echo ""
    echo "Available Documentation:"
    echo ""
    echo "📄 ADMIN_SETUP.md - Single temple admin setup"
    echo "📄 MULTI_TEMPLE_SETUP.md - Multi-temple system setup"
    echo "📄 README.md - Project overview and usage"
    echo ""
    echo "Available Scripts:"
    echo ""
    echo "🔧 setup.sh - Main setup script (this file)"
    echo "🚀 scripts/quick-setup.sh - Quick setup with instructions"
    echo "⚙️  scripts/setup-single-temple.js - Single temple setup"
    echo "📄 scripts/run-sql.sh - SQL script runner"
    echo "📊 scripts/run-migration.js - Database migration runner"
    echo ""
    echo "SQL Files:"
    echo ""
    echo "📊 supabase/migrations/20250127020000_add_admin_management.sql"
    echo "🏛️  supabase/migrations/20250127050000_remove_multi_temple_support.sql"
    echo ""
    echo "Environment Setup:"
    echo ""
    echo "1. Create .env file with your Supabase credentials:"
    echo "   VITE_SUPABASE_URL=your_supabase_project_url"
    echo "   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key"
    echo "   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key"
    echo ""
    echo "2. Install dependencies:"
    echo "   npm install @supabase/supabase-js dotenv"
    echo ""
    echo "3. Run the setup script:"
    echo "   ./setup.sh"
    echo ""
    
    read -p "Press Enter to continue..."
}

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        print_error "Make sure you're in the directory containing package.json"
        exit 1
    fi
}

# Function to check if scripts exist
check_scripts() {
    local missing_scripts=()
    
    if [ ! -f "scripts/quick-setup.sh" ]; then
        missing_scripts+=("scripts/quick-setup.sh")
    fi
    
    if [ ! -f "scripts/setup-single-temple.js" ]; then
        missing_scripts+=("scripts/setup-single-temple.js")
    fi
    
    if [ ! -f "scripts/run-sql.sh" ]; then
        missing_scripts+=("scripts/run-sql.sh")
    fi
    
    if [ ${#missing_scripts[@]} -gt 0 ]; then
        print_error "Missing required scripts:"
        for script in "${missing_scripts[@]}"; do
            echo "  - $script"
        done
        exit 1
    fi
}

# Function to make scripts executable
make_scripts_executable() {
    print_status "Making scripts executable..."
    chmod +x scripts/*.sh 2>/dev/null || true
    chmod +x scripts/*.js 2>/dev/null || true
    print_success "Scripts are now executable"
}

# Main function
main() {
    # Check directory
    check_directory
    
    # Check scripts
    check_scripts
    
    # Make scripts executable
    make_scripts_executable
    
    # Show main menu
    handle_main_menu
    
    print_success "Setup process completed!"
    print_status "You can now use the temple management system."
    print_status "Run './setup.sh' again anytime to access the menu."
}

# Run main function
main "$@"
