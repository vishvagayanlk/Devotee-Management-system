# 🔐 Clerk Authentication Setup Guide

## 1. Get Clerk API Keys

1. **Go to [Clerk Dashboard](https://dashboard.clerk.com/)**
2. **Create a new application** or use existing
3. **Go to API Keys section**
4. **Copy your keys:**
   - Publishable Key (starts with `pk_`)
   - Secret Key (starts with `sk_`)

## 2. Environment Variables

Add these to your `.env.local` file:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here

# Supabase (for database only)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 3. Clerk Configuration

### Sign-up Settings
- **Enable email verification**
- **Allow sign-ups**
- **Set password requirements**
- **Configure email templates**

### User Profile Settings
- **Enable profile management**
- **Set required fields**
- **Configure custom fields for temple data**

### Email Templates
- **Customize sign-up email**
- **Customize password reset email**
- **Add temple branding**

## 4. Database Integration

Clerk will handle authentication, but we'll still use Supabase for:
- User profiles and temple data
- Groups and events
- Devotee records
- Admin management

## 5. Migration Benefits

✅ **Reliable email delivery** - No more validation errors
✅ **Better user experience** - Professional auth UI
✅ **Production ready** - Enterprise-grade security
✅ **Easy customization** - Temple-themed components
✅ **Better error handling** - Clear error messages
✅ **Mobile optimized** - Works perfectly on all devices
