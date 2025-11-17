#!/usr/bin/env node

/**
 * Database Setup Script for Supabase
 * Executes SQL files using direct PostgreSQL connection
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

const { Client } = pg;

// Load environment variables
config();

async function executeSQLFile(client, filePath, description) {
  console.log(`\n📄 ${description}`);
  console.log(`   Reading: ${filePath}`);

  try {
    const sql = readFileSync(filePath, 'utf-8');
    console.log(`   File size: ${(sql.length / 1024).toFixed(2)} KB`);

    console.log(`   Executing SQL...`);

    await client.query(sql);

    console.log(`   ✅ Success!\n`);

  } catch (error) {
    console.error(`\n   ❌ Error: ${error.message}\n`);
    throw error;
  }
}

async function main() {
  console.log('\n===========================================');
  console.log('🚀 Vacation Rental Database Setup');
  console.log('===========================================\n');

  // Check for database URL
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (!databaseUrl) {
    console.error('❌ Missing database connection URL\n');
    console.error('Please provide your Supabase database URL in one of these ways:\n');
    console.error('Option 1: Add to .env file:');
    console.error('  DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres\n');
    console.error('Option 2: Run with environment variable:');
    console.error('  DATABASE_URL="your-url-here" node run-sql.mjs\n');
    console.error('📍 Find your database URL in Supabase Dashboard:');
    console.error('   Settings → Database → Connection String → URI\n');
    console.error('═══════════════════════════════════════════════════════════════\n');
    console.error('🔧 ALTERNATIVE: Manual Setup (Recommended)\n');
    console.error('1. Go to your Supabase Dashboard');
    console.error('2. Navigate to: SQL Editor → New Query');
    console.error('3. Copy and paste contents of: supabase-schema.sql');
    console.error('4. Click "Run" to execute');
    console.error('5. Repeat for: seed-data.sql\n');
    console.error('See SETUP-GUIDE.md for detailed instructions.\n');
    process.exit(1);
  }

  console.log('📍 Database URL configured');
  console.log(`   Host: ${databaseUrl.match(/@([^:]+)/)?.[1] || 'unknown'}\n`);

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Execute schema file
    await executeSQLFile(
      client,
      './supabase-schema.sql',
      '1️⃣  Creating Database Schema'
    );

    // Execute seed data file
    await executeSQLFile(
      client,
      './seed-data.sql',
      '2️⃣  Loading Sample Data'
    );

    console.log('===========================================');
    console.log('✅ Database Setup Complete!');
    console.log('===========================================\n');
    console.log('📋 Created:');
    console.log('   ✓ user_profiles table');
    console.log('   ✓ properties table (8 sample properties)');
    console.log('   ✓ reservations table');
    console.log('   ✓ Row Level Security policies');
    console.log('   ✓ Availability check functions');
    console.log('   ✓ Storage bucket configuration\n');
    console.log('🎉 Ready to run: npm run dev\n');

  } catch (error) {
    console.error('\n===========================================');
    console.error('❌ Setup Failed');
    console.error('===========================================\n');
    console.error(`Error: ${error.message}\n`);

    if (error.message.includes('authentication failed')) {
      console.error('💡 Tip: Check your database password');
      console.error('   The password in your DATABASE_URL might be incorrect.\n');
    } else if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      console.error('💡 Tip: Check your network connection');
      console.error('   Make sure you can reach your Supabase project.\n');
    } else if (error.message.includes('already exists')) {
      console.error('💡 Tip: Tables might already exist');
      console.error('   Check your database in Supabase Dashboard → Table Editor\n');
    }

    console.error('═══════════════════════════════════════════════════════════════');
    console.error('📖 Manual Setup Instructions:\n');
    console.error('1. Open Supabase Dashboard → SQL Editor');
    console.error('2. Create new query and paste: supabase-schema.sql');
    console.error('3. Click Run');
    console.error('4. Create another query and paste: seed-data.sql');
    console.error('5. Click Run\n');
    process.exit(1);

  } finally {
    await client.end();
  }
}

main();
