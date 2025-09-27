#!/bin/bash

# Create Admin Account Script
# This script creates an admin account in both Clerk and Supabase

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

# Function to check if required tools are installed
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
    
    print_success "All dependencies are installed."
}

# Function to check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        print_error ".env file not found. Please create one with your environment variables."
        print_status "Required variables:"
        echo "  - VITE_SUPABASE_URL"
        echo "  - VITE_SUPABASE_ANON_KEY"
        echo "  - CLERK_SECRET_KEY"
        exit 1
    fi
    print_success ".env file found."
}

# Function to get user input
get_user_input() {
    echo
    print_status "Please provide the following information:"
    echo
    
    # Get email
    while true; do
        read -p "Admin Email: " ADMIN_EMAIL
        if [[ $ADMIN_EMAIL =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            break
        else
            print_error "Please enter a valid email address."
        fi
    done
    
    # Get password
    while true; do
        read -s -p "Password (min 8 characters): " ADMIN_PASSWORD
        echo
        if [ ${#ADMIN_PASSWORD} -ge 8 ]; then
            break
        else
            print_error "Password must be at least 8 characters long."
        fi
    done
    
    # Confirm password
    while true; do
        read -s -p "Confirm Password: " CONFIRM_PASSWORD
        echo
        if [ "$ADMIN_PASSWORD" = "$CONFIRM_PASSWORD" ]; then
            break
        else
            print_error "Passwords do not match. Please try again."
        fi
    done
    
    # Get full name
    read -p "Full Name (optional): " ADMIN_FULL_NAME
    if [ -z "$ADMIN_FULL_NAME" ]; then
        ADMIN_FULL_NAME="Temple Administrator"
    fi
    
    # Get role
    echo
    print_status "Select admin role:"
    echo "1) admin (standard admin)"
    echo "2) super_admin (highest privilege)"
    echo "3) committee (committee member)"
    
    while true; do
        read -p "Enter choice (1-3): " ROLE_CHOICE
        case $ROLE_CHOICE in
            1) ADMIN_ROLE="admin"; break;;
            2) ADMIN_ROLE="super_admin"; break;;
            3) ADMIN_ROLE="committee"; break;;
            *) print_error "Please enter 1, 2, or 3.";;
        esac
    done
}

# Function to create admin account
create_admin_account() {
    print_status "Creating admin account..."
    
    # Create a temporary Node.js script
    cat > temp_create_admin.js << EOF
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminProfile() {
    try {
        console.log('🔧 Creating admin profile in Supabase...');
        
        const adminProfile = {
            email: '${ADMIN_EMAIL}',
            full_name: '${ADMIN_FULL_NAME}',
            role: '${ADMIN_ROLE}',
            is_approved: true,
            status: 'approved',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('user_profiles')
            .insert(adminProfile)
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error creating admin profile:', error.message);
            process.exit(1);
        }
        
        console.log('✅ Admin profile created successfully!');
        console.log('📋 Profile Details:');
        console.log('   ID:', data.id);
        console.log('   Email:', data.email);
        console.log('   Name:', data.full_name);
        console.log('   Role:', data.role);
        console.log('   Status:', data.status);
        console.log('   Approved:', data.is_approved);
        
        console.log('\\n🎯 Next Steps:');
        console.log('1. Create a Clerk account with email: ${ADMIN_EMAIL}');
        console.log('2. Use password: [your chosen password]');
        console.log('3. The system will automatically link the Clerk account to this admin profile');
        console.log('4. Add this email to your VITE_ADMIN_EMAILS in .env file');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
        process.exit(1);
    }
}

createAdminProfile();
EOF

    # Run the script
    node temp_create_admin.js
    
    # Clean up
    rm temp_create_admin.js
}

# Function to update environment variables
update_env_file() {
    print_status "Updating .env file with admin email..."
    
    # Check if VITE_ADMIN_EMAILS already exists
    if grep -q "VITE_ADMIN_EMAILS" .env; then
        # Update existing VITE_ADMIN_EMAILS
        sed -i "s/VITE_ADMIN_EMAILS=.*/VITE_ADMIN_EMAILS=${ADMIN_EMAIL}/" .env
        print_success "Updated VITE_ADMIN_EMAILS in .env file"
    else
        # Add new VITE_ADMIN_EMAILS
        echo "" >> .env
        echo "# Admin Configuration" >> .env
        echo "VITE_ADMIN_EMAILS=${ADMIN_EMAIL}" >> .env
        print_success "Added VITE_ADMIN_EMAILS to .env file"
    fi
}

# Function to show final instructions
show_final_instructions() {
    echo
    print_success "Admin account creation completed!"
    echo
    print_status "Summary:"
    echo "  Email: ${ADMIN_EMAIL}"
    echo "  Name: ${ADMIN_FULL_NAME}"
    echo "  Role: ${ADMIN_ROLE}"
    echo "  Password: [hidden]"
    echo
    print_status "Next Steps:"
    echo "1. Create a Clerk account at: https://clerk.com"
    echo "   - Use email: ${ADMIN_EMAIL}"
    echo "   - Use password: [your chosen password]"
    echo
    echo "2. Update Vercel Environment Variables:"
    echo "   - Go to: https://vercel.com/dashboard"
    echo "   - Select your project: devetee-managment-system"
    echo "   - Go to Settings → Environment Variables"
    echo "   - Add: VITE_ADMIN_EMAILS=${ADMIN_EMAIL}"
    echo "   - Add: VITE_ADMIN_DOMAINS=temple.com"
    echo "   - Add: VITE_ADMIN_PATTERNS=admin,manager,supervisor"
    echo
    echo "3. Deploy to Vercel:"
    echo "   - Push to GitHub: git add . && git commit -m 'Add admin' && git push"
    echo "   - Vercel will auto-deploy, or run: vercel --prod"
    echo
    echo "4. Login to your app with the admin credentials"
    echo
    print_warning "Important: Keep your admin credentials secure!"
    print_warning "Note: .env file is NOT deployed to Vercel - you must add env vars manually!"
}

# Main execution
main() {
    echo "=========================================="
    echo "    Admin Account Creation Script"
    echo "=========================================="
    echo
    
    check_dependencies
    check_env_file
    get_user_input
    
    echo
    print_status "Creating admin account with the following details:"
    echo "  Email: ${ADMIN_EMAIL}"
    echo "  Name: ${ADMIN_FULL_NAME}"
    echo "  Role: ${ADMIN_ROLE}"
    echo
    
    read -p "Continue? (y/N): " CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
        print_status "Operation cancelled."
        exit 0
    fi
    
    create_admin_account
    update_env_file
    show_final_instructions
}

# Run main function
main "$@"
