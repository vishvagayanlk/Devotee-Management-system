// Deployment configuration for Supabase hosting
export const deployConfig = {
  // Build configuration
  build: {
    command: 'npm run build',
    outputDir: 'dist',
    installCommand: 'npm ci',
  },
  
  // Environment variables
  env: {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  },
  
  // Headers for security and performance
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },
  
  // Redirects for SPA routing
  redirects: [
    {
      source: '/(.*)',
      destination: '/index.html',
      statusCode: 200,
    },
  ],
  
  // Cache configuration
  cache: {
    static: {
      '*.js': '1y',
      '*.css': '1y',
      '*.png': '1y',
      '*.jpg': '1y',
      '*.jpeg': '1y',
      '*.gif': '1y',
      '*.svg': '1y',
      '*.ico': '1y',
    },
    api: {
      '*.json': '1h',
    },
  },
};
