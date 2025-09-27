#!/bin/bash

# Migration Runner Script
# This script helps you run migrations in the correct order

echo "🏛️  Temple Management System - Migration Runner"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -d "supabase/migrations" ]; then
    echo "❌ Error: supabase/migrations directory not found"
    echo "   Please run this script from the project root directory"
    exit 1
fi

# List all migration files
echo "📄 Available migrations:"
ls -la supabase/migrations/*.sql | awk '{print "   " $9 " (" $5 " bytes)"}'
echo ""

# Show the latest migration (create_temple function)
echo "🚀 Latest migration (create_temple function):"
echo "   supabase/migrations/20250127040000_add_create_temple_function.sql"
echo ""

echo "📋 To run migrations:"
echo "1. Go to your Supabase Dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Run the migration files in order"
echo ""

echo "🔧 Quick migration runner:"
echo "   node scripts/run-migration.js supabase/migrations/20250127040000_add_create_temple_function.sql"
echo ""

echo "🧪 After running migrations, test with:"
echo "   node scripts/csv-setup.js --temples=templates/temples.csv"
echo ""

echo "✅ Migration files are ready to run!"
