# 🗄️ Database Setup Instructions

## 🚨 Issue Identified

The profile loading issue is caused by **missing database migrations**. The database is missing:

1. **`clerk_id` column** in `user_profiles` table
2. **`user_profile_details` table** for additional profile information

## ✅ Quick Fix

### **Step 1: Run Database Migrations**

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Select your project
   - Go to **SQL Editor**

2. **Copy and paste the migration SQL:**
   - Open the file: `supabase/manual-migrations.sql`
   - Copy all the SQL content
   - Paste it into the SQL Editor

3. **Execute the migrations:**
   - Click **Run** to execute all the SQL statements
   - You should see success messages for each statement

### **Step 2: Verify the Setup**

Run the connection test:
```bash
node scripts/test-connection.js
```

You should see:
- ✅ Database connection successful
- ✅ user_profiles table accessible
- ✅ clerk_id column exists
- ✅ user_profile_details table exists

### **Step 3: Test Profile Loading**

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Test the signup flow:**
   - Visit: http://localhost:5173/sign-up
   - Create a new account
   - Check if profile loading works

3. **Use debug tool if needed:**
   - Visit: http://localhost:5173/debug
   - Check diagnostics for any remaining issues

## 🔧 What the Migrations Do

### **Migration 1: Clerk Integration**
- Adds `clerk_id` column to `user_profiles` table
- Creates index for better performance
- Updates RLS policies to work with Clerk authentication

### **Migration 2: User Profile Details**
- Creates `user_profile_details` table for additional information
- Sets up proper relationships and constraints
- Configures RLS policies for data security
- Adds triggers for automatic timestamp updates

## 🎯 Expected Result

After running the migrations:

1. **Profile creation will work** - No more "Loading your profile..." stuck screen
2. **User onboarding will appear** - New users will see the profile setup form
3. **All data will be saved** - Profile information will be properly stored
4. **Debug tool will show green** - All diagnostics should pass

## 🚨 If Migrations Fail

If you get errors when running the SQL:

1. **Check permissions** - Make sure you're using the service role key
2. **Run statements one by one** - Execute each section separately
3. **Check for existing data** - Some statements might fail if data already exists
4. **Contact support** - If issues persist, check Supabase documentation

## 📞 Need Help?

- **Supabase Documentation:** https://supabase.com/docs
- **SQL Editor Guide:** https://supabase.com/docs/guides/database/sql-editor
- **RLS Policies:** https://supabase.com/docs/guides/auth/row-level-security

**Once the migrations are complete, your profile loading issue will be resolved! 🎉**
