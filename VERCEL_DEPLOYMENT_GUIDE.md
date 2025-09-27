# Vercel Deployment Guide for Temple Management System

## 🚀 Step-by-Step Vercel Deployment

### Prerequisites
- Node.js installed (version 18 or higher)
- Git repository with your code
- Supabase project set up
- Terminal/Command Prompt access

---

## Step 1: Install Vercel CLI

### Option A: Using npm (Recommended)
```bash
npm install -g vercel
```

### Option B: Using yarn
```bash
yarn global add vercel
```

### Option C: Using pnpm
```bash
pnpm add -g vercel
```

### Verify Installation
```bash
vercel --version
```

---

## Step 2: Login to Vercel

### Method 1: Interactive Login (Recommended)
```bash
vercel login
```

This will:
1. Open your browser
2. Redirect to Vercel's login page
3. Choose your preferred login method:
   - **GitHub** (Recommended - if your code is on GitHub)
   - **GitLab**
   - **Bitbucket**
   - **Email**

### Method 2: Login with Email
```bash
vercel login --email your-email@example.com
```

### Verify Login
```bash
vercel whoami
```

---

## Step 3: Prepare Your Project

### 1. Ensure you're in the project directory
```bash
cd /Users/vishvawijayasinghe/Documents/personal/project
```

### 2. Check if you have a Git repository
```bash
git status
```

If not initialized:
```bash
git init
git add .
git commit -m "Initial commit - Temple Management System"
```

### 3. Push to GitHub (if not already done)
```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/temple-management.git

# Push your code
git push -u origin main
```

---

## Step 4: Deploy to Vercel

### Method 1: Deploy from Current Directory
```bash
vercel
```

This will prompt you with:
1. **Set up and deploy?** → Type `Y` and press Enter
2. **Which scope?** → Select your account
3. **Link to existing project?** → Type `N` for new project
4. **What's your project's name?** → Type `temple-management` or your preferred name
5. **In which directory is your code located?** → Press Enter (current directory)
6. **Want to override the settings?** → Type `N` (unless you want to customize)

### Method 2: Deploy with Specific Settings
```bash
vercel --prod
```

---

## Step 5: Configure Environment Variables

### 1. Go to Vercel Dashboard
- Visit [vercel.com/dashboard](https://vercel.com/dashboard)
- Find your project and click on it

### 2. Add Environment Variables
- Go to **Settings** → **Environment Variables**
- Add these variables:

```
VITE_SUPABASE_URL = your_supabase_project_url
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
```

### 3. Redeploy After Adding Variables
```bash
vercel --prod
```

---

## Step 6: Configure Build Settings

### 1. In Vercel Dashboard
- Go to **Settings** → **General**
- Scroll to **Build & Development Settings**

### 2. Set Build Configuration
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`

### 3. Save Settings
- Click **Save** to apply changes

---

## Step 7: Custom Domain (Optional)

### 1. Add Custom Domain
- Go to **Settings** → **Domains**
- Click **Add Domain**
- Enter your domain name
- Follow DNS configuration instructions

### 2. Configure DNS
- Add CNAME record pointing to your Vercel domain
- Wait for DNS propagation (up to 24 hours)

---

## Step 8: Monitor Deployment

### 1. Check Deployment Status
```bash
vercel ls
```

### 2. View Logs
```bash
vercel logs your-project-name
```

### 3. Open Your Site
```bash
vercel open
```

---

## 🔧 Troubleshooting Common Issues

### Issue 1: Build Fails
**Error**: Build command failed
**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try building locally first
npm run build

# If successful, redeploy
vercel --prod
```

### Issue 2: Environment Variables Not Working
**Error**: Supabase connection fails
**Solution**:
1. Check variable names (must start with `VITE_`)
2. Ensure variables are added to production environment
3. Redeploy after adding variables

### Issue 3: 404 Errors on Refresh
**Error**: Page not found on refresh
**Solution**:
1. Go to Vercel Dashboard → Settings → Functions
2. Add `vercel.json` file to project root:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Issue 4: CORS Errors
**Error**: CORS policy blocks requests
**Solution**:
1. Check Supabase CORS settings
2. Ensure your Vercel domain is added to allowed origins
3. Update Supabase project settings

---

## 📱 Mobile App Deployment (PWA)

### 1. Test PWA Features
- Open your deployed site on mobile
- Look for "Add to Home Screen" option
- Test offline functionality

### 2. Configure PWA Settings
- Update `public/manifest.json` with your domain
- Test push notifications (if implemented)

---

## 🔄 Continuous Deployment

### 1. Automatic Deployments
- Connect your GitHub repository
- Every push to main branch triggers deployment
- Preview deployments for pull requests

### 2. Manual Deployments
```bash
# Deploy current state
vercel

# Deploy to production
vercel --prod

# Deploy specific branch
vercel --prod --target production
```

---

## 📊 Performance Monitoring

### 1. Vercel Analytics
- Built-in analytics dashboard
- Core Web Vitals tracking
- Real user monitoring

### 2. Custom Monitoring
- Performance metrics already implemented
- Check browser console for performance logs
- Use Chrome DevTools Lighthouse

---

## 🎯 Final Checklist

- [ ] Vercel CLI installed and logged in
- [ ] Project deployed successfully
- [ ] Environment variables configured
- [ ] Build settings optimized
- [ ] Site accessible via Vercel URL
- [ ] PWA features working
- [ ] Performance monitoring active
- [ ] Custom domain configured (optional)

---

## 🆘 Getting Help

### Vercel Support
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Vercel Discord](https://vercel.com/discord)

### Common Commands Reference
```bash
# Check status
vercel whoami
vercel ls

# Deploy
vercel
vercel --prod

# View logs
vercel logs

# Open site
vercel open

# Remove deployment
vercel remove project-name
```

---

## 🎉 Success!

Once deployed, your temple management system will be:
- ✅ Globally accessible via Vercel's CDN
- ✅ Automatically optimized for performance
- ✅ Secure with HTTPS
- ✅ PWA-ready for mobile installation
- ✅ Continuously deployed from your Git repository

Your temple management system is now live and ready for your community! 🏛️
