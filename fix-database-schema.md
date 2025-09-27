# Fix Database Schema

The application is getting database errors because some columns are missing from the `user_profiles` table.

## Quick Fix

Run the following SQL script in your Supabase SQL editor:

```sql
-- Fix user_profiles table schema
-- Add missing columns if they don't exist

-- Add is_approved column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Add first_name and last_name columns for profile completion checks
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Update existing records to set is_approved to false if it's NULL
UPDATE user_profiles SET is_approved = false WHERE is_approved IS NULL;

-- Update existing records to populate first_name and last_name from full_name if they don't exist
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

## Steps

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Paste the above SQL script
4. Click "Run" to execute the script

This will add the missing columns and populate them with existing data.
