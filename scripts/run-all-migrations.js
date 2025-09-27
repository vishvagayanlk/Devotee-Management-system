#!/usr/bin/env node

/**
 * Run All Migrations
 * 
 * This script runs all migration files in order
 */

import fs from 'fs';
import path from 'path';

async function runAllMigrations() {
  try {
    console.log('🚀 Running all migrations...');
    
    const migrationsDir = 'supabase/migrations';
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to run in chronological order
    
    console.log(`📄 Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    
    console.log('\n📋 Instructions:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run each migration file in order:');
    
    migrationFiles.forEach((file, index) => {
      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      console.log(`\n${'='.repeat(80)}`);
      console.log(`Migration ${index + 1}/${migrationFiles.length}: ${file}`);
      console.log('='.repeat(80));
      console.log(content);
      console.log('='.repeat(80));
    });
    
    console.log('\n✅ After running all migrations, test with:');
    console.log('   node scripts/csv-setup.js --temples=templates/temples.csv');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

runAllMigrations();
