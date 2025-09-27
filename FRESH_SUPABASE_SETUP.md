# 🚀 Fresh Supabase Project Setup Guide

## **Step 1: Create New Supabase Project**

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Click **"New Project"**

2. **Project Settings:**
   - **Name:** `temple-management-system`
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to your location
   - Click **"Create new project"**

3. **Wait for Setup:**
   - Project creation takes 2-3 minutes
   - You'll see a progress indicator

## **Step 2: Get Your Project Credentials**

Once the project is ready:

1. **Go to Settings → API**
2. **Copy these values:**
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)
   - **service_role** key (starts with `eyJ`)

## **Step 3: Update Your .env File**

Replace your existing `.env` file with:

```env
# Fresh Supabase Project Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Clerk Authentication (keep your existing keys)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_aW1tdW5lLWdhci03Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_ncTTn7waEMRiD4dOjHuYt791UlxbnhAGdRYuwyrFcC
```

## **Step 4: Run the Setup Script**

```bash
node setup-production.js
```

This will create all the necessary tables and set up the database.

## **Step 5: Test the Setup**

```bash
npm run dev
```

Visit: http://localhost:5175/sign-up

## **Step 6: Verify Everything Works**

1. **Create a new account**
2. **Complete profile setup**
3. **Access the dashboard**
4. **Check diagnostics at** http://localhost:5175/debug

## **🎯 What the Setup Script Creates**

- ✅ `user_profiles` table with `clerk_id` column
- ✅ `user_profile_details` table for additional info
- ✅ `groups` table with default groups
- ✅ Proper indexes and RLS policies
- ✅ Default temple groups

## **📞 Need Help?**

If you encounter any issues:
1. Check the console logs for errors
2. Visit the debug tool at `/debug`
3. Verify your environment variables are correct
4. Make sure the Supabase project is fully created

**This fresh setup will be clean and working! 🚀**
