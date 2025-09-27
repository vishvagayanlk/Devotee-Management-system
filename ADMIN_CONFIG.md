# Admin Configuration Guide

This system now uses **configurable admin detection** instead of hardcoded emails. You can configure admin access through environment variables.

## Environment Variables

Add these to your `.env` file or Vercel environment variables:

### Required Variables
```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Clerk Configuration
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

### Admin Configuration (Optional)
```bash
# Comma-separated list of admin emails
VITE_ADMIN_EMAILS=admin@temple.com,admin@yourdomain.com,temple.admin@gmail.com

# Comma-separated list of admin domains (any email from these domains will be admin)
VITE_ADMIN_DOMAINS=temple.com,yourdomain.com,admin.local

# Comma-separated list of patterns (emails containing these patterns will be admin)
VITE_ADMIN_PATTERNS=admin,manager,supervisor

# Comma-separated list of super admin emails (highest privilege)
VITE_SUPER_ADMIN_EMAILS=superadmin@temple.com,root@temple.com
```

## How Admin Detection Works

The system checks admin status in this order:

1. **Exact Email Match** - If email is in `VITE_ADMIN_EMAILS`
2. **Super Admin Match** - If email is in `VITE_SUPER_ADMIN_EMAILS` (gets `super_admin` role)
3. **Domain Match** - If email domain is in `VITE_ADMIN_DOMAINS`
4. **Pattern Match** - If email contains any pattern from `VITE_ADMIN_PATTERNS`

## Examples

### Example 1: Simple Admin Email
```bash
VITE_ADMIN_EMAILS=admin@temple.com
```
- `admin@temple.com` → Admin
- `user@temple.com` → Regular user

### Example 2: Domain-based Admin
```bash
VITE_ADMIN_DOMAINS=temple.com,admin.local
```
- `anyone@temple.com` → Admin
- `anyone@admin.local` → Admin
- `anyone@other.com` → Regular user

### Example 3: Pattern-based Admin
```bash
VITE_ADMIN_PATTERNS=admin,manager,supervisor
```
- `admin@anywhere.com` → Admin
- `manager@company.com` → Admin
- `supervisor@org.org` → Admin
- `user@company.com` → Regular user

### Example 4: Mixed Configuration
```bash
VITE_ADMIN_EMAILS=admin@temple.com,root@temple.com
VITE_ADMIN_DOMAINS=temple.com
VITE_ADMIN_PATTERNS=admin,manager
VITE_SUPER_ADMIN_EMAILS=superadmin@temple.com
```
- `superadmin@temple.com` → Super Admin
- `admin@temple.com` → Admin
- `root@temple.com` → Admin
- `manager@anywhere.com` → Admin
- `anyone@temple.com` → Admin
- `user@other.com` → Regular user

## Default Behavior

If no admin configuration is provided, the system defaults to:
- **Pattern**: `admin` (any email containing "admin" becomes admin)
- **No specific emails or domains**

## Roles

- **`devotee`** - Regular user (pending approval)
- **`admin`** - Admin user (approved)
- **`super_admin`** - Super admin user (highest privilege)

## Security Notes

- Environment variables are safe to use in frontend code (VITE_ prefix)
- Admin detection happens client-side for immediate access
- Database profiles are still created for persistence
- Super admin emails should be kept secure

## Migration from Hardcoded

If you were using hardcoded admin emails before:

1. **Add environment variables** to your `.env` file
2. **Deploy to Vercel** with the new environment variables
3. **Remove old admin profiles** from database (optional)
4. **Test admin access** with configured emails

## Troubleshooting

### Admin not working?
1. Check environment variables are set correctly
2. Verify email matches your configuration
3. Check browser console for admin detection logs
4. Test with a simple pattern like `admin@test.com`

### Want to add new admin?
1. Add email to `VITE_ADMIN_EMAILS`
2. Or add domain to `VITE_ADMIN_DOMAINS`
3. Or add pattern to `VITE_ADMIN_PATTERNS`
4. Redeploy or restart development server
