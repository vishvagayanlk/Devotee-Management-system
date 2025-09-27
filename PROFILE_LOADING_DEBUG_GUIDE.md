# 🔍 Profile Loading Debug Guide

## 🚨 Issue Identified

After signup with Clerk, users are getting stuck on the "Loading your profile..." screen. This is likely due to:

1. **Database connection issues**
2. **Missing database migrations**
3. **RLS (Row Level Security) policy conflicts**
4. **Missing tables or columns**

## ✅ Debugging Improvements Added

### **1. Enhanced Logging**
- **Detailed console logs** for every step of profile creation
- **Error details** with codes, messages, and hints
- **Database connection testing** before profile operations
- **Step-by-step progress tracking**

### **2. Timeout Protection**
- **15-second timeout** to prevent infinite loading
- **Automatic fallback** if profile creation fails
- **Graceful error handling** with user feedback

### **3. Database Migration Support**
- **Fallback handling** for missing tables
- **Graceful degradation** when additional tables don't exist
- **Database setup script** for easy migration

### **4. Debug Tools**
- **Profile Debugger component** at `/debug` route
- **Real-time diagnostics** of database state
- **Connection testing** and error reporting
- **Step-by-step troubleshooting guide**

## 🛠️ How to Debug

### **Step 1: Access Debug Tool**
1. **Start your dev server:** `npm run dev`
2. **Visit:** `http://localhost:5173/debug`
3. **Check the diagnostics** for any red errors

### **Step 2: Check Console Logs**
1. **Open browser console** (F12)
2. **Look for detailed logs** starting with:
   - "Starting profile creation for user:"
   - "Testing Supabase connection..."
   - "Profile creation result:"

### **Step 3: Run Database Setup**
If the debug tool shows missing tables:
```bash
# Run the database setup script
node scripts/setup-database.js
```

### **Step 4: Check Environment Variables**
Make sure your `.env.local` has:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
```

## 🔧 Common Issues & Solutions

### **Issue 1: Database Connection Failed**
**Symptoms:** Red error in debug tool, console shows connection errors
**Solution:**
- Check Supabase URL and keys
- Verify Supabase project is active
- Check network connectivity

### **Issue 2: Missing Tables**
**Symptoms:** "Table doesn't exist" errors
**Solution:**
```bash
node scripts/setup-database.js
```

### **Issue 3: RLS Policy Conflicts**
**Symptoms:** "Permission denied" errors
**Solution:**
- The setup script updates RLS policies
- Check if user has proper permissions

### **Issue 4: Profile Creation Timeout**
**Symptoms:** Stuck on loading screen for 15+ seconds
**Solution:**
- Check console for specific errors
- Use debug tool to identify the issue
- Profile will load even if creation fails (with timeout)

## 📊 Debug Information

The debug tool shows:
- ✅ **Supabase Connection Status**
- ✅ **Table Existence & Data**
- ✅ **Current User Profile Status**
- ✅ **RLS Policy Status**
- ✅ **Detailed Error Messages**

## 🚀 Quick Fixes

### **Immediate Fix (if stuck on loading):**
1. **Refresh the page** - timeout will kick in
2. **Check console logs** for specific errors
3. **Visit `/debug`** to see detailed diagnostics

### **Database Setup:**
```bash
# Install dependencies if needed
npm install dotenv

# Run database setup
node scripts/setup-database.js
```

### **Environment Check:**
```bash
# Check if .env.local exists and has required variables
cat .env.local | grep -E "(SUPABASE|CLERK)"
```

## 📝 Expected Behavior

### **Normal Flow:**
1. **User signs up** → Clerk authentication
2. **Profile creation starts** → Console logs appear
3. **Database connection test** → Should succeed
4. **Profile created/updated** → User profile loaded
5. **Profile completion check** → Shows setup screen if incomplete
6. **Access granted** → Full app functionality

### **Error Flow:**
1. **User signs up** → Clerk authentication
2. **Profile creation starts** → Console logs appear
3. **Error occurs** → Detailed error logged
4. **Timeout kicks in** → Profile loaded anyway (with error state)
5. **User can proceed** → May need to complete profile setup

## 🎯 Next Steps

1. **Test the debug tool** at `/debug`
2. **Check console logs** for detailed error information
3. **Run database setup** if tables are missing
4. **Verify environment variables** are correct
5. **Test signup flow** again

The enhanced debugging should help identify exactly where the profile loading is failing! 🔍✨
