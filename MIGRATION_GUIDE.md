# Database Migration Guide

## Current Issue
The app is failing because the `is_approved` column doesn't exist in the `user_profiles` table. This is causing 400/406 errors when trying to create or update user profiles.

## Solution
Run the following SQL script in your Supabase dashboard to add the missing columns.

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project

### 2. Open SQL Editor
1. In the left sidebar, click on "SQL Editor"
2. Click "New Query"

### 3. Run the Migration Script
Copy and paste this entire SQL script:

```sql
-- Add is_approved and status columns to user_profiles table
-- Run this in your Supabase SQL Editor

-- Add is_approved column with default false
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Add status column for more detailed user states
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Update existing records to set is_approved to false and status to pending
UPDATE user_profiles 
SET is_approved = false, status = 'pending' 
WHERE is_approved IS NULL OR status IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_approved ON user_profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_clerk_id ON user_profiles(clerk_id);

-- Add first_name and last_name columns for profile completion checks
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Update existing records to populate first_name and last_name from full_name
UPDATE user_profiles 
SET first_name = SPLIT_PART(full_name, ' ', 1),
    last_name = CASE 
        WHEN POSITION(' ' IN full_name) > 0 
        THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
        ELSE ''
    END
WHERE (first_name IS NULL OR first_name = '') 
   OR (last_name IS NULL OR last_name = '');

-- Update phone_number from phone if it doesn't exist
UPDATE user_profiles 
SET phone_number = phone 
WHERE phone_number IS NULL AND phone IS NOT NULL;
```

### 4. Execute the Script
1. Click the "Run" button
2. Wait for the script to complete
3. You should see "Success" message

### 5. Verify the Migration
After running the script, you can verify it worked by running this query:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('is_approved', 'status', 'first_name', 'last_name', 'phone_number');
```

You should see all 5 columns listed.

## After Migration

Once the migration is complete, the app will work properly with:
- User approval system
- Admin panel for approving/rejecting users
- Profile completion tracking
- Proper database queries

## If You Need Help

If you encounter any issues:
1. Check the Supabase logs for errors
2. Make sure you have the correct permissions
3. Try running the script in smaller parts if needed

The app is currently working with a temporary fix, but running this migration will enable the full user approval system.
