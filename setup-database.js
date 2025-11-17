#!/usr/bin/env node

/**
 * Database Setup Script
 * This script executes the schema and seed SQL files in your Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('\n❌ Error: Missing Supabase credentials');
  console.error('\nPlease set the following environment variables:');
  console.error('  VITE_SUPABASE_URL          - Your Supabase project URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY  - Your Supabase service role key (NOT the anon key)');
  console.error('\nYou can find these in your Supabase Dashboard → Settings → API');
  console.error('\n⚠️  The service role key is required to execute DDL statements (CREATE TABLE, etc.)');
  console.error('    DO NOT use the anon key - it will not work for schema creation.\n');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQLFile(filePath, description) {
  console.log(`\n📄 Reading ${filePath}...`);

  try {
    const sql = readFileSync(filePath, 'utf-8');
    console.log(`✓ File read successfully (${sql.length} characters)`);

    console.log(`\n🔄 Executing ${description}...`);

    // Split SQL into individual statements (basic splitting - may need improvement for complex SQL)
    // For now, we'll try to execute the entire file as one transaction
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If RPC doesn't exist, try direct SQL execution
      console.log('⚠️  RPC method not available, trying direct execution...');

      // Try executing via Postgres REST API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql_query: sql })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ ${description} executed successfully!`);
      return result;
    }

    console.log(`✅ ${description} executed successfully!`);
    return data;

  } catch (error) {
    console.error(`\n❌ Error executing ${description}:`);
    console.error(error.message);

    console.error('\n💡 Alternative: Execute SQL files manually via Supabase SQL Editor');
    console.error('   1. Go to your Supabase Dashboard');
    console.error('   2. Navigate to SQL Editor');
    console.error(`   3. Copy and paste the contents of ${filePath}`);
    console.error('   4. Click "Run" to execute\n');

    throw error;
  }
}

async function main() {
  console.log('\n===========================================');
  console.log('🚀 Vacation Rental Database Setup');
  console.log('===========================================');
  console.log(`\n📍 Supabase URL: ${SUPABASE_URL}`);

  try {
    // Execute schema file
    await executeSQLFile(
      join(__dirname, 'supabase-schema.sql'),
      'Database Schema (tables, functions, RLS policies)'
    );

    // Execute seed data file
    await executeSQLFile(
      join(__dirname, 'seed-data.sql'),
      'Sample Property Data (8 properties)'
    );

    console.log('\n===========================================');
    console.log('✅ Database setup completed successfully!');
    console.log('===========================================');
    console.log('\n📋 What was created:');
    console.log('   • user_profiles table');
    console.log('   • properties table');
    console.log('   • reservations table');
    console.log('   • Row Level Security policies');
    console.log('   • Helper functions for availability checking');
    console.log('   • Storage bucket for property images');
    console.log('   • 8 sample vacation rental properties');
    console.log('\n🎉 You can now run: npm run dev\n');

  } catch (error) {
    console.error('\n❌ Database setup failed!');
    console.error('\nPlease use the manual method:');
    console.error('1. Open Supabase Dashboard → SQL Editor');
    console.error('2. Execute supabase-schema.sql first');
    console.error('3. Execute seed-data.sql second');
    console.error('\nSee SETUP-GUIDE.md for detailed instructions.\n');
    process.exit(1);
  }
}

main();
