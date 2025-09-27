# 🗄️ Supabase Database

## 📁 Clean Structure

This folder contains only the essential database files:

```
supabase/
├── README.md                    # This file
├── sql/
│   └── 01-setup-database.sql   # Complete database setup
└── manual-migrations.sql        # Legacy file (can be removed)
```

## 🚀 Quick Setup

### **Option 1: Use Setup Script (Recommended)**
```bash
node setup-fresh-supabase.js
```

### **Option 2: Manual Setup**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste `sql/01-setup-database.sql`
3. Click Run

## 📋 What Gets Created

- ✅ **user_profiles** - Main user table with Clerk integration
- ✅ **groups** - Temple groups (with default groups)
- ✅ **user_profile_details** - Additional profile information
- ✅ **events** - Temple events and activities
- ✅ **records** - Devotee records and contributions
- ✅ **temple_settings** - Temple customization settings

## 🔧 Features

- **Simple RLS policies** - Easy to understand and modify
- **Proper indexes** - Optimized for performance
- **Default data** - Groups and settings pre-populated
- **Clean structure** - No unnecessary complexity

## 📞 Need Help?

- Check the setup script logs
- Visit `/debug` in your app
- Verify environment variables are correct
