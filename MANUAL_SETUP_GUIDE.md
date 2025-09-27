# 🚀 Manual Setup Guide - Fresh Supabase Project

Since the automated script has issues with fresh projects, let's set up manually. This is actually more reliable!

## **Step 1: Create Fresh Supabase Project**

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

## **Step 2: Get Your Supabase Credentials**

Once the project is ready:

1. **Go to Settings → API**
2. **Copy these values:**
   - **Project URL** (starts with `https://`)
   - **anon public** key (starts with `eyJ`)
   - **service_role** key (starts with `eyJ`)

## **Step 3: Update Your .env File**

Replace your `.env` file with:

```env
# Fresh Supabase Project Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Clerk Authentication (keep your existing keys)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_aW1tdW5lLWdhci03Mi5jbGVyay5hY2NvdW50cy5kZXYk
CLERK_SECRET_KEY=sk_test_ncTTn7waEMRiD4dOjHuYt791UlxbnhAGdRYuwyrFcC
```

## **Step 4: Set Up Database (Manual)**

1. **Go to Supabase Dashboard → SQL Editor**
2. **Copy the entire contents of:** `supabase/sql/01-setup-database.sql`
3. **Paste it into the SQL Editor**
4. **Click "Run"**

This will create all the necessary tables and data.

## **Step 5: Test Your Setup**

```bash
npm run dev
```

Visit: http://localhost:5175/sign-up

## **Step 6: Verify Everything Works**

1. **Create a new account**
2. **Complete profile setup**
3. **Access the dashboard**
4. **Check diagnostics at:** http://localhost:5175/debug

## **🎯 What Gets Created**

- ✅ **user_profiles** - Main user table with Clerk integration
- ✅ **groups** - Temple groups (with default groups)
- ✅ **user_profile_details** - Additional profile information
- ✅ **events** - Temple events and activities
- ✅ **records** - Devotee records and contributions
- ✅ **temple_settings** - Temple customization settings

## **🔧 If You Get Errors**

### **Database Connection Issues:**
- Check your environment variables are correct
- Make sure Supabase project is fully created
- Verify the project is not paused

### **SQL Execution Issues:**
- Run the SQL statements one by one
- Check for syntax errors
- Make sure you're using the service role key

### **Profile Loading Issues:**
- Visit `/debug` to see diagnostics
- Check console logs for errors
- Verify all tables were created

## **📋 Quick Checklist**

- [ ] Supabase project created
- [ ] Credentials copied to .env
- [ ] SQL executed in Supabase Dashboard
- [ ] Development server started
- [ ] Signup flow tested
- [ ] Debug tool shows green checkmarks

**This manual approach is more reliable and gives you full control! 🚀**
