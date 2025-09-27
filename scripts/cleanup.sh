#!/bin/bash

# ==============================================
# Project Cleanup Script
# ==============================================
# This script cleans up the project by removing
# unnecessary files and organizing everything
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

# Function to show cleanup menu
show_cleanup_menu() {
    clear
    print_header "🧹 Project Cleanup"
    echo ""
    echo "Choose cleanup option:"
    echo ""
    echo "1. 🗑️  Remove all temporary files"
    echo "   - Remove .DS_Store, Thumbs.db, etc."
    echo "   - Clean up build artifacts"
    echo "   - Remove log files"
    echo ""
    echo "2. 📁 Organize project structure"
    echo "   - Move scripts to proper directories"
    echo "   - Organize documentation"
    echo "   - Clean up root directory"
    echo ""
    echo "3. 🧹 Full cleanup (Recommended)"
    echo "   - Remove temporary files"
    echo "   - Organize project structure"
    echo "   - Remove unused files"
    echo "   - Optimize project layout"
    echo ""
    echo "4. 🔍 Show what would be cleaned"
    echo "   - List files that would be removed"
    echo "   - Show organization changes"
    echo "   - Preview cleanup results"
    echo ""
    echo "5. 🚪 Exit"
    echo ""
}

# Function to remove temporary files
remove_temp_files() {
    print_status "Removing temporary files..."
    
    # Remove common temporary files
    find . -name ".DS_Store" -type f -delete 2>/dev/null || true
    find . -name "Thumbs.db" -type f -delete 2>/dev/null || true
    find . -name "*.tmp" -type f -delete 2>/dev/null || true
    find . -name "*.log" -type f -delete 2>/dev/null || true
    find . -name "*.swp" -type f -delete 2>/dev/null || true
    find . -name "*.swo" -type f -delete 2>/dev/null || true
    find . -name "*~" -type f -delete 2>/dev/null || true
    find . -name ".vscode" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name ".idea" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Remove build artifacts
    rm -rf dist/ 2>/dev/null || true
    rm -rf build/ 2>/dev/null || true
    rm -rf .next/ 2>/dev/null || true
    rm -rf node_modules/.cache/ 2>/dev/null || true
    
    # Remove coverage reports
    rm -rf coverage/ 2>/dev/null || true
    rm -rf .nyc_output/ 2>/dev/null || true
    
    print_success "Temporary files removed"
}

# Function to organize project structure
organize_project() {
    print_status "Organizing project structure..."
    
    # Create directories if they don't exist
    mkdir -p docs/
    mkdir -p scripts/
    mkdir -p templates/
    mkdir -p supabase/migrations/
    mkdir -p src/
    
    # Move documentation files
    if [ -f "ADMIN_SETUP.md" ]; then
        mv ADMIN_SETUP.md docs/
        print_status "Moved ADMIN_SETUP.md to docs/"
    fi
    
    if [ -f "MULTI_TEMPLE_SETUP.md" ]; then
        mv MULTI_TEMPLE_SETUP.md docs/
        print_status "Moved MULTI_TEMPLE_SETUP.md to docs/"
    fi
    
    if [ -f "CSV_SETUP_README.md" ]; then
        mv CSV_SETUP_README.md docs/
        print_status "Moved CSV_SETUP_README.md to docs/"
    fi
    
    if [ -f "SCRIPTS_README.md" ]; then
        mv SCRIPTS_README.md docs/
        print_status "Moved SCRIPTS_README.md to docs/"
    fi
    
    if [ -f "TROUBLESHOOTING.md" ]; then
        mv TROUBLESHOOTING.md docs/
        print_status "Moved TROUBLESHOOTING.md to docs/"
    fi
    
    # Move SQL files
    if [ -f "admin-management.sql" ]; then
        mv admin-management.sql supabase/
        print_status "Moved admin-management.sql to supabase/"
    fi
    
    if [ -f "setup-admin.sql" ]; then
        mv setup-admin.sql supabase/
        print_status "Moved setup-admin.sql to supabase/"
    fi
    
    if [ -f "run-admin-setup.sql" ]; then
        mv run-admin-setup.sql supabase/
        print_status "Moved run-admin-setup.sql to supabase/"
    fi
    
    if [ -f "multi-temple-setup.sql" ]; then
        mv multi-temple-setup.sql supabase/
        print_status "Moved multi-temple-setup.sql to supabase/"
    fi
    
    # Move debug SQL files
    if [ -f "debug_trigger.sql" ]; then
        mv debug_trigger.sql supabase/
        print_status "Moved debug_trigger.sql to supabase/"
    fi
    
    if [ -f "disable_trigger.sql" ]; then
        mv disable_trigger.sql supabase/
        print_status "Moved disable_trigger.sql to supabase/"
    fi
    
    print_success "Project structure organized"
}

# Function to remove unused files
remove_unused_files() {
    print_status "Removing unused files..."
    
    # Remove old README files if they exist
    if [ -f "README_OLD.md" ]; then
        rm README_OLD.md
        print_status "Removed README_OLD.md"
    fi
    
    # Remove backup files
    find . -name "*.bak" -type f -delete 2>/dev/null || true
    find . -name "*.backup" -type f -delete 2>/dev/null || true
    
    # Remove old package files
    if [ -f "package-lock.json.old" ]; then
        rm package-lock.json.old
        print_status "Removed package-lock.json.old"
    fi
    
    print_success "Unused files removed"
}

# Function to optimize project layout
optimize_layout() {
    print_status "Optimizing project layout..."
    
    # Create a clean .gitignore if it doesn't exist
    if [ ! -f ".gitignore" ]; then
        cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Production builds
dist/
build/
.next/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Coverage
coverage/
.nyc_output/

# Temporary files
*.tmp
*.temp
EOF
        print_status "Created .gitignore"
    fi
    
    # Create a clean package.json scripts section
    if [ -f "package.json" ]; then
        print_status "Package.json already exists"
    fi
    
    print_success "Project layout optimized"
}

# Function to show what would be cleaned
show_cleanup_preview() {
    print_header "🔍 Cleanup Preview"
    echo ""
    
    echo "Files that would be removed:"
    echo "============================"
    
    # Find temporary files
    find . -name ".DS_Store" -type f 2>/dev/null | head -10
    find . -name "Thumbs.db" -type f 2>/dev/null | head -10
    find . -name "*.tmp" -type f 2>/dev/null | head -10
    find . -name "*.log" -type f 2>/dev/null | head -10
    find . -name "*.swp" -type f 2>/dev/null | head -10
    find . -name "*.swo" -type f 2>/dev/null | head -10
    find . -name "*~" -type f 2>/dev/null | head -10
    
    echo ""
    echo "Directories that would be organized:"
    echo "===================================="
    echo "docs/ - Documentation files"
    echo "supabase/ - SQL files and migrations"
    echo "scripts/ - All setup and management scripts"
    echo "templates/ - CSV templates"
    echo ""
    
    echo "Files that would be moved:"
    echo "=========================="
    ls -la *.md 2>/dev/null | grep -v README.md || echo "No markdown files to move"
    ls -la *.sql 2>/dev/null || echo "No SQL files to move"
    echo ""
}

# Function to handle menu selection
handle_menu() {
    while true; do
        show_cleanup_menu
        read -p "Enter your choice (1-5): " choice
        
        case $choice in
            1)
                remove_temp_files
                break
                ;;
            2)
                organize_project
                break
                ;;
            3)
                print_status "Running full cleanup..."
                remove_temp_files
                organize_project
                remove_unused_files
                optimize_layout
                break
                ;;
            4)
                show_cleanup_preview
                read -p "Press Enter to continue..."
                ;;
            5)
                print_status "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-5."
                sleep 2
                ;;
        esac
    done
}

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the project root directory"
        exit 1
    fi
}

# Main function
main() {
    print_header "🧹 Project Cleanup Script"
    echo ""
    
    # Check directory
    check_directory
    
    # Show menu
    handle_menu
    
    print_success "Cleanup completed!"
    print_status "Your project is now clean and organized."
}

# Run main function
main "$@"
