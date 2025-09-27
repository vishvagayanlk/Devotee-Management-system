# Troubleshooting Guide

## Database Error: "Database error saving new user"

This error typically occurs when there's an issue with the Supabase configuration or database setup. Here's how to debug and fix it:

### 1. Check Environment Variables

Make sure you have a `.env` file in your project root with the correct Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

You can get these values from your Supabase project dashboard under Settings > API.

### 2. Use the Debug Tool

The Auth component now includes a debug tool:

1. Go to the login/register page
2. Click the bug icon in the debug section
3. Click "Run Debug Test" to check:
   - Environment variables are set
   - Database connection is working
   - Tables are accessible

### 3. Common Issues and Solutions

#### Missing Environment Variables
- **Error**: "Missing Supabase environment variables"
- **Solution**: Create a `.env` file with your Supabase credentials

#### Database Connection Failed
- **Error**: "Database connection test failed"
- **Solution**: 
  - Check your Supabase URL and key are correct
  - Ensure your Supabase project is active
  - Check if RLS policies are blocking access

#### Profile Creation Failed
- **Error**: "Database error saving new user"
- **Solution**:
  - Check if the `create_temple_profile` trigger exists
  - Verify RLS policies allow profile creation
  - Check database logs in Supabase dashboard

### 4. Database Setup

Make sure all migrations have been applied:

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the migration files in order:
   - `20250924041526_wispy_oasis.sql`
   - `20250924141226_still_glitter.sql`
   - `20250924143101_ancient_flame.sql`
   - `20250924151127_add_internal_user_creation.sql`
   - `20250924151128_stark_pond.sql`

### 5. Debug the Database Trigger

The error "Database error saving new user" is likely caused by the `create_temple_profile` trigger failing. To debug this:

1. **Run the debug script**: Copy and paste the contents of `debug_trigger.sql` into your Supabase SQL Editor
2. **Check the results**: Look for any errors or issues with the trigger function
3. **Temporarily disable the trigger**: If the trigger is causing issues, run `disable_trigger.sql` to disable it temporarily
4. **Test user creation**: After disabling the trigger, try creating a user again - it should work with manual profile creation

### 6. Test with Admin Account

Use the test admin account to verify the system works:
- Email: `admin@temple.lk`
- Password: `Admin123!`

### 7. Check Browser Console

Open browser developer tools and check the console for detailed error messages. The improved error handling will show specific database errors.

### 8. Supabase Dashboard

Check your Supabase project dashboard for:
- Authentication logs
- Database logs
- RLS policy violations
- Function execution errors

## Getting Help

If you're still experiencing issues:

1. Check the browser console for detailed error messages
2. Use the debug tool in the Auth component
3. Check Supabase project logs
4. Verify all migrations have been applied correctly
