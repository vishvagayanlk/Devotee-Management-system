# Admin Account Setup Guide

This guide explains how to create admin accounts for the Temple Management System using Clerk authentication and Supabase database.

## Prerequisites

1. **Environment Variables** - Make sure you have these set:
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   CLERK_SECRET_KEY=your_clerk_secret_key  # For full automation
   ```

2. **Clerk Secret Key** - Get this from your Clerk dashboard:
   - Go to [Clerk Dashboard](https://dashboard.clerk.com)
   - Select your application
   - Go to "API Keys" section
   - Copy the "Secret Key"

## Method 1: Full Automation (Recommended)

This method creates both the Clerk user and Supabase profile automatically.

### Usage:
```bash
node create-admin-account.js <email> <password> [full_name]
```

### Examples:
```bash
# Create admin with full name
node create-admin-account.js admin@temple.com password123 "Temple Administrator"

# Create admin with just email and password
node create-admin-account.js admin@temple.com password123
```

### What it does:
1. ✅ Creates user in Clerk with email and password
2. ✅ Creates admin profile in Supabase database
3. ✅ Sets role as 'admin' and status as 'approved'
4. ✅ Provides login credentials

## Method 2: Database Only

This method creates only the Supabase profile. You'll need to create the Clerk account manually.

### Usage:
```bash
node create-admin-direct.js <email> <full_name> [clerk_id]
```

### Examples:
```bash
# Create profile with auto-generated Clerk ID
node create-admin-direct.js admin@temple.com "Temple Administrator"

# Create profile with specific Clerk ID
node create-admin-direct.js admin@temple.com "Temple Administrator" "user_123456789"
```

### What it does:
1. ✅ Creates admin profile in Supabase database
2. ✅ Generates Clerk ID if not provided
3. ✅ Provides SQL for manual database insertion
4. ⚠️ You need to create Clerk account manually

## Method 3: SQL Direct

This method uses SQL to create the admin profile directly in the database.

### Usage:
1. Edit `create-admin.sql` and update the email and name
2. Run the SQL script in your Supabase SQL editor

### What it does:
1. ✅ Creates admin profile with auto-generated Clerk ID
2. ✅ Shows the Clerk ID for manual account creation
3. ✅ Verifies the admin was created

## Method 4: Manual Process

If you prefer to do everything manually:

### Step 1: Create Clerk Account
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to "Users" section
3. Click "Add user"
4. Enter email and password
5. Note down the User ID

### Step 2: Create Supabase Profile
Run this SQL in your Supabase SQL editor:
```sql
INSERT INTO user_profiles (
    clerk_id,
    email,
    full_name,
    is_approved,
    status,
    role,
    created_at,
    updated_at
) VALUES (
    'YOUR_CLERK_USER_ID',
    'admin@temple.com',
    'Temple Administrator',
    true,
    'approved',
    'admin',
    NOW(),
    NOW()
);
```

## Verification

After creating an admin account, verify it works:

1. **Check Database** - Query the user_profiles table:
   ```sql
   SELECT * FROM user_profiles WHERE role = 'admin';
   ```

2. **Test Login** - Go to your app and sign in with the admin credentials

3. **Check Permissions** - Verify the admin can access admin-only features

## Troubleshooting

### Common Issues:

1. **"Missing environment variables"**
   - Check your `.env` file
   - Ensure all required variables are set

2. **"Clerk user creation failed"**
   - Verify your Clerk secret key
   - Check if the email already exists in Clerk

3. **"Database profile creation failed"**
   - Check your Supabase connection
   - Verify the user_profiles table exists
   - Check for missing columns (run the schema fix script)

4. **"User can't access admin features"**
   - Verify the role is set to 'admin'
   - Check if is_approved is true
   - Ensure status is 'approved'

### Debug Commands:

```bash
# Test Supabase connection
node -e "
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
supabase.from('user_profiles').select('count').then(console.log);
"

# Test Clerk connection
node -e "
fetch('https://api.clerk.com/v1/users', {
  headers: { 'Authorization': 'Bearer ' + process.env.CLERK_SECRET_KEY }
}).then(r => r.json()).then(console.log);
"
```

## Security Notes

- ⚠️ **Never commit secret keys** to version control
- ⚠️ **Use strong passwords** for admin accounts
- ⚠️ **Limit admin access** to trusted individuals
- ⚠️ **Regularly audit** admin accounts
- ⚠️ **Use environment variables** for sensitive data

## Admin Features

Once created, admin accounts can:
- ✅ Access admin dashboard
- ✅ Manage user approvals
- ✅ View all user profiles
- ✅ Manage temple settings
- ✅ Access all system features

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test database and Clerk connections separately
4. Check the troubleshooting section above
