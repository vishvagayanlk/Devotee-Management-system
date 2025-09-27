# Vercel Deployment Guide

## 🚀 How to Deploy with Environment Variables

### **The Issue:**
When you deploy to Vercel, your local `.env` file is **NOT automatically included**. You need to manually add environment variables in the Vercel dashboard.

### **Step-by-Step Process:**

#### **1. Run the Admin Creation Script**
```bash
./create-admin.sh
```
This will:
- Create admin profile in Supabase
- Update your local `.env` file
- Show you the environment variables to add

#### **2. Add Environment Variables to Vercel**

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `devetee-managment-system`
3. **Click on "Settings"** tab
4. **Click on "Environment Variables"** in the left sidebar
5. **Add these variables one by one**:

```bash
# Required for basic functionality
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Admin configuration (from the script)
VITE_ADMIN_EMAILS=admin@temple.com
VITE_ADMIN_DOMAINS=temple.com
VITE_ADMIN_PATTERNS=admin,manager,supervisor
VITE_SUPER_ADMIN_EMAILS=superadmin@temple.com
```

#### **3. Deploy Your Code**

**Option A: Automatic Deployment (if connected to GitHub)**
```bash
git add .
git commit -m "Add admin creation script"
git push origin main
# Vercel will automatically deploy
```

**Option B: Manual Deployment**
```bash
vercel --prod
```

#### **4. Test Admin Access**

1. **Visit your Vercel URL**: `https://devetee-management-system.vercel.app`
2. **Sign up with admin email**: `admin@temple.com`
3. **Check if you get admin access** (not "limited access")

### **Common Issues & Solutions:**

#### **❌ Problem: "Limited Access" in Vercel**
**Cause**: Environment variables not set in Vercel
**Solution**: Add `VITE_ADMIN_EMAILS=admin@temple.com` to Vercel dashboard

#### **❌ Problem: "undefined" in browser console**
**Cause**: Environment variables not loaded
**Solution**: Check Vercel environment variables are set correctly

#### **❌ Problem: Database connection fails**
**Cause**: Supabase credentials not set in Vercel
**Solution**: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Vercel

### **Environment Variables Reference:**

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | Database connection | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Database auth key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Authentication | `pk_test_xxx` |
| `VITE_ADMIN_EMAILS` | Admin email list | `admin@temple.com,admin2@temple.com` |
| `VITE_ADMIN_DOMAINS` | Admin domains | `temple.com,admin.local` |
| `VITE_ADMIN_PATTERNS` | Admin patterns | `admin,manager,supervisor` |
| `VITE_SUPER_ADMIN_EMAILS` | Super admin emails | `superadmin@temple.com` |

### **Quick Checklist:**

- [ ] Run `./create-admin.sh`
- [ ] Add environment variables to Vercel dashboard
- [ ] Deploy code to Vercel
- [ ] Test admin login
- [ ] Verify admin access (not "limited access")

### **Pro Tips:**

1. **Test locally first**: Make sure admin detection works with `npm run dev`
2. **Check Vercel logs**: If something fails, check Vercel function logs
3. **Redeploy after env changes**: Environment variables require a new deployment
4. **Use different env vars for different environments**: Production vs staging

### **Need Help?**

If you're still having issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test with a simple admin email like `admin@test.com`
