# Production Configuration

## Environment Variables for Production

Create a `.env.production` file with these variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Analytics and Monitoring
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint
VITE_SENTRY_DSN=your_sentry_dsn

# Optional: Custom Domain
VITE_APP_URL=https://your-temple-domain.com

# Optional: Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

## Quick Production Setup Steps

1. **Set up email service** (Gmail SMTP recommended)
2. **Configure Supabase security settings**
3. **Deploy to Vercel/Netlify**
4. **Set environment variables**
5. **Test all functionality**
6. **Go live!**
