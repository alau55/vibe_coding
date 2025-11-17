# Database Setup Guide

This guide will help you set up the vacation rental database in Supabase.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created
3. Your project credentials

## Method 1: Manual Setup (Recommended)

This is the easiest and most reliable method.

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Execute Schema File

1. Open `supabase-schema.sql` in your code editor
2. Copy the entire contents
3. Paste into the SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Wait for success message

This creates:
- ✅ `user_profiles` table
- ✅ `properties` table
- ✅ `reservations` table
- ✅ Row Level Security policies
- ✅ Helper functions
- ✅ Storage bucket

### Step 3: Execute Seed Data File

1. Create another **New Query**
2. Open `seed-data.sql` in your code editor
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run**

This adds:
- ✅ 8 sample vacation rental properties

### Step 4: Verify Setup

1. Go to **Table Editor** in Supabase Dashboard
2. Check that you see:
   - `properties` table with 8 rows
   - `user_profiles` table (empty)
   - `reservations` table (empty)

## Method 2: Automated Setup (Advanced)

Use this method if you prefer command-line tools.

### Step 1: Get Database Connection String

1. Go to Supabase Dashboard
2. Navigate to **Settings** → **Database**
3. Scroll to **Connection String**
4. Select **URI** tab
5. Copy the connection string
6. Replace `[YOUR-PASSWORD]` with your actual database password

Example:
```
postgresql://postgres:your-password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

### Step 2: Add to .env File

Add the DATABASE_URL to your `.env` file:

```bash
# Add this line
DATABASE_URL=postgresql://postgres:your-password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

### Step 3: Run Setup Script

```bash
node run-sql.mjs
```

The script will:
- ✅ Connect to your database
- ✅ Execute `supabase-schema.sql`
- ✅ Execute `seed-data.sql`
- ✅ Report success or errors

## What Gets Created

### Tables

**user_profiles**
- Extends auth.users with additional profile data
- Automatically created via trigger on user signup

**properties**
- Stores vacation rental listings
- Includes name, description, location, price, amenities, images
- Public read access, authenticated write

**reservations**
- Stores booking information
- Links users to properties with dates
- RLS policies ensure users only see their own bookings

### Security

**Row Level Security (RLS)**
- All tables have RLS enabled
- Users can only access their own data
- Properties are publicly viewable
- Reservations are private

### Functions

**check_property_availability()**
- Checks if property is available for given dates
- Prevents double-booking
- Excludes cancelled reservations

**get_property_booked_dates()**
- Returns all booked dates for a property
- Used for calendar display
- Only shows future bookings

### Storage

**property-images bucket**
- Public bucket for property photos
- Anyone can view
- Authenticated users can upload

## Troubleshooting

### "relation already exists" Error

The tables already exist. You can either:
- Skip this step (database already set up)
- Drop existing tables first (⚠️ this deletes all data):
  ```sql
  DROP TABLE IF EXISTS public.reservations CASCADE;
  DROP TABLE IF EXISTS public.properties CASCADE;
  DROP TABLE IF EXISTS public.user_profiles CASCADE;
  ```

### Authentication Errors

- Make sure you're using the correct database password
- The password is in Settings → Database → Database Settings
- Don't confuse it with your Supabase account password

### Connection Timeout

- Check your internet connection
- Verify your Supabase project is active
- Try the manual method instead

### Permission Errors

- Make sure you're the project owner
- Check that RLS policies were created correctly

## Next Steps

After setting up the database:

1. ✅ Configure your `.env` file with Supabase credentials
2. ✅ Run `npm run dev` to start the application
3. ✅ Create a test account and explore
4. ✅ Make a test reservation

See `SETUP-GUIDE.md` for complete application setup instructions.
