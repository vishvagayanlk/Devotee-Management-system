# Temple Management System - Deployment Guide

## Hosting Options

### Option 1: Vercel (Recommended)
Vercel provides excellent integration with Supabase and automatic deployments.

1. **Connect to Vercel:**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

2. **Environment Variables:**
   Set these in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

3. **Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`

### Option 2: Netlify
1. **Connect to Netlify:**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify init
   ```

2. **Deploy:**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

### Option 3: Supabase + Vercel Integration
1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Link to Supabase project:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **Deploy database migrations:**
   ```bash
   supabase db push
   ```

4. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

## Performance Optimizations Applied

### 1. Build Optimizations
- ✅ Code splitting with manual chunks
- ✅ Tree shaking enabled
- ✅ Minification and compression
- ✅ Modern browser targeting (ESNext)

### 2. React Optimizations
- ✅ Lazy loading for route components
- ✅ React.memo for expensive components
- ✅ useMemo for expensive calculations
- ✅ useCallback for event handlers

### 3. Database Optimizations
- ✅ Query caching with TTL
- ✅ Optimized Supabase queries
- ✅ Connection pooling

### 4. UI/UX Optimizations
- ✅ Virtual scrolling for large lists
- ✅ Loading states and skeletons
- ✅ Responsive design
- ✅ PWA capabilities

### 5. Offline Support
- ✅ Service worker implementation
- ✅ Cache-first strategy
- ✅ Background sync
- ✅ Push notifications

## Environment Setup

### Required Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Build Commands
```bash
# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Performance Monitoring

### Web Vitals
The app includes performance monitoring for:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)

### Database Performance
- Query response times
- Cache hit rates
- Connection pool usage

## Security Features

### Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### Authentication
- JWT tokens with PKCE flow
- Row Level Security (RLS)
- Role-based access control

## Troubleshooting

### Common Issues

1. **Build fails:**
   - Check Node.js version (>= 18)
   - Clear node_modules and reinstall
   - Check environment variables

2. **Database connection issues:**
   - Verify Supabase URL and keys
   - Check RLS policies
   - Ensure migrations are applied

3. **Performance issues:**
   - Check browser dev tools
   - Monitor network requests
   - Verify caching is working

### Support
For issues and questions, check the troubleshooting guide in `/docs/TROUBLESHOOTING.md`
