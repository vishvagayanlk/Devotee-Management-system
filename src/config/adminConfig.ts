// Admin configuration - no hardcoded emails
export interface AdminConfig {
  adminEmails: string[];
  adminDomains: string[];
  adminPatterns: string[];
  superAdminEmails: string[];
}

// Get admin configuration from environment variables
export const getAdminConfig = (): AdminConfig => {
  // In Vite, environment variables are available as import.meta.env
  const getEnvVar = (key: string): string => {
    // Try import.meta.env first (Vite), then process.env (Node.js)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || '';
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || '';
    }
    return '';
  };

  // Get admin emails from environment variable (comma-separated)
  const adminEmailsEnv = getEnvVar('VITE_ADMIN_EMAILS');
  const adminEmails = adminEmailsEnv 
    ? adminEmailsEnv.split(',').map(email => email.trim().toLowerCase())
    : [];

  // Get admin domains from environment variable (comma-separated)
  const adminDomainsEnv = getEnvVar('VITE_ADMIN_DOMAINS');
  const adminDomains = adminDomainsEnv 
    ? adminDomainsEnv.split(',').map(domain => domain.trim().toLowerCase())
    : [];

  // Get admin patterns from environment variable (comma-separated)
  const adminPatternsEnv = getEnvVar('VITE_ADMIN_PATTERNS') || 'admin';
  const adminPatterns = adminPatternsEnv 
    ? adminPatternsEnv.split(',').map(pattern => pattern.trim().toLowerCase())
    : ['admin'];

  // Get super admin emails (highest privilege)
  const superAdminEmailsEnv = getEnvVar('VITE_SUPER_ADMIN_EMAILS');
  const superAdminEmails = superAdminEmailsEnv 
    ? superAdminEmailsEnv.split(',').map(email => email.trim().toLowerCase())
    : [];

  return {
    adminEmails,
    adminDomains,
    adminPatterns,
    superAdminEmails,
  };
};

// Check if an email is an admin email
export const isAdminEmail = (email: string): boolean => {
  if (!email) return false;
  
  const config = getAdminConfig();
  const emailLower = email.toLowerCase();

  // Check exact email matches
  if (config.adminEmails.includes(emailLower)) {
    return true;
  }

  // Check super admin emails
  if (config.superAdminEmails.includes(emailLower)) {
    return true;
  }

  // Check domain matches
  const emailDomain = emailLower.split('@')[1];
  if (emailDomain && config.adminDomains.includes(emailDomain)) {
    return true;
  }

  // Check pattern matches (e.g., contains "admin")
  if (config.adminPatterns.some(pattern => emailLower.includes(pattern))) {
    return true;
  }

  return false;
};

// Check if an email is a super admin
export const isSuperAdminEmail = (email: string): boolean => {
  if (!email) return false;
  
  const config = getAdminConfig();
  const emailLower = email.toLowerCase();
  
  return config.superAdminEmails.includes(emailLower);
};

// Get admin role based on email
export const getAdminRole = (email: string): 'admin' | 'super_admin' | 'devotee' => {
  if (!email) return 'devotee';
  
  if (isSuperAdminEmail(email)) {
    return 'super_admin';
  }
  
  if (isAdminEmail(email)) {
    return 'admin';
  }
  
  return 'devotee';
};

// Get admin status based on email
export const getAdminStatus = (email: string): 'approved' | 'pending' => {
  if (!email) return 'pending';
  
  // All admin emails are automatically approved
  if (isAdminEmail(email)) {
    return 'approved';
  }
  
  return 'pending';
};

// Get admin approval status based on email
export const getAdminApproval = (email: string): boolean => {
  if (!email) return false;
  
  // All admin emails are automatically approved
  return isAdminEmail(email);
};
