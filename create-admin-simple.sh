#!/bin/bash

# Simple Admin Creation Script
# Creates admin profile in Supabase and matches it to Clerk ID

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

# Function to check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        print_error ".env file not found. Please create one with your Supabase credentials."
        print_status "Required variables:"
        echo "  - VITE_SUPABASE_URL"
        echo "  - VITE_SUPABASE_ANON_KEY"
        exit 1
    fi
    print_success ".env file found."
}

# Function to get user input
get_user_input() {
    echo
    print_status "Please provide the following information:"
    echo
    
    # Get Clerk ID
    while true; do
        read -p "Clerk User ID (e.g., user_2abc123def456): " CLERK_ID
        if [[ $CLERK_ID =~ ^user_[a-zA-Z0-9]+$ ]]; then
            break
        else
            print_error "Please enter a valid Clerk User ID (starts with 'user_')"
        fi
    done
    
    # Get email
    while true; do
        read -p "Admin Email: " ADMIN_EMAIL
        if [[ $ADMIN_EMAIL =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
            break
        else
            print_error "Please enter a valid email address."
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

# Function to create admin profile in Supabase
create_admin_profile() {
    print_status "Creating admin profile in Supabase..."
    
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
            clerk_id: '${CLERK_ID}',
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
        console.log('   Clerk ID:', data.clerk_id);
        console.log('   Email:', data.email);
        console.log('   Name:', data.full_name);
        console.log('   Role:', data.role);
        console.log('   Status:', data.status);
        console.log('   Approved:', data.is_approved);
        
        console.log('\\n🎯 Next Steps:');
        console.log('1. Login to your app with the Clerk account');
        console.log('2. The system will automatically recognize this as an admin');
        console.log('3. No environment variables needed - everything is in the database!');
        
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

# Function to show how to get Clerk ID
show_clerk_id_instructions() {
    echo
    print_status "How to get your Clerk User ID:"
    echo
    echo "Method 1: From Clerk Dashboard"
    echo "1. Go to https://clerk.com/dashboard"
    echo "2. Select your application"
    echo "3. Go to 'Users' section"
    echo "4. Find your user and copy the User ID"
    echo
    echo "Method 2: From Browser Console"
    echo "1. Login to your app"
    echo "2. Open browser console (F12)"
    echo "3. Type: window.Clerk?.user?.id"
    echo "4. Copy the returned ID"
    echo
    echo "Method 3: From App URL"
    echo "1. Login to your app"
    echo "2. Check the URL - sometimes the ID is visible"
    echo
}

# Function to show final instructions
show_final_instructions() {
    echo
    print_success "Admin account creation completed!"
    echo
    print_status "Summary:"
    echo "  Clerk ID: ${CLERK_ID}"
    echo "  Email: ${ADMIN_EMAIL}"
    echo "  Name: ${ADMIN_FULL_NAME}"
    echo "  Role: ${ADMIN_ROLE}"
    echo
    print_status "What happens next:"
    echo "1. Login to your app with the Clerk account"
    echo "2. The system will find this profile by Clerk ID"
    echo "3. You'll get full admin access immediately"
    echo "4. No environment variables needed!"
    echo
    print_warning "Important: Keep your Clerk credentials secure!"
}

# Main execution
main() {
    echo "=========================================="
    echo "    Simple Admin Creation Script"
    echo "=========================================="
    echo
    
    check_env_file
    show_clerk_id_instructions
    get_user_input
    
    echo
    print_status "Creating admin profile with the following details:"
    echo "  Clerk ID: ${CLERK_ID}"
    echo "  Email: ${ADMIN_EMAIL}"
    echo "  Name: ${ADMIN_FULL_NAME}"
    echo "  Role: ${ADMIN_ROLE}"
    echo
    
    read -p "Continue? (y/N): " CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
        print_status "Operation cancelled."
        exit 0
    fi
    
    create_admin_profile
    show_final_instructions
}

# Run main function
main "$@"
