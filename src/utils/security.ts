// Security utilities for the temple management system

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Validate Sri Lankan NIC number
 */
export const validateNIC = (nic: string): boolean => {
  if (!nic) return false;
  
  // Remove spaces and convert to uppercase
  const cleanNIC = nic.replace(/\s/g, '').toUpperCase();
  
  // Old format: 9 digits + V/X
  const oldFormat = /^[0-9]{9}[VX]$/;
  // New format: 12 digits
  const newFormat = /^[0-9]{12}$/;
  
  return oldFormat.test(cleanNIC) || newFormat.test(cleanNIC);
};

/**
 * Validate Sri Lankan phone number
 */
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  
  // Remove spaces and special characters
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Sri Lankan phone number patterns
  const patterns = [
    /^0[1-9][0-9]{8}$/, // Local format: 0771234567
    /^\+94[1-9][0-9]{8}$/, // International format: +94771234567
    /^94[1-9][0-9]{8}$/, // International without +: 94771234567
  ];
  
  return patterns.some(pattern => pattern.test(cleanPhone));
};

/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  
  // More comprehensive email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const trimmedEmail = email.trim().toLowerCase();
  
  // Check for basic structure
  if (!emailRegex.test(trimmedEmail)) return false;
  
  // Check for valid length
  if (trimmedEmail.length > 254) return false;
  
  // Check for valid local part (before @)
  const [localPart, domain] = trimmedEmail.split('@');
  if (!localPart || localPart.length > 64) return false;
  
  // Check for valid domain
  if (!domain || domain.length > 253) return false;
  
  return true;
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;
  
  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);
    
    if (!record) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Reset if window has passed
    if (now - record.lastAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }
    
    // Check if limit exceeded
    if (record.count >= this.maxAttempts) {
      return false;
    }
    
    // Increment attempt count
    record.count++;
    record.lastAttempt = now;
    
    return true;
  }
  
  getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record || record.count < this.maxAttempts) {
      return 0;
    }
    
    const elapsed = Date.now() - record.lastAttempt;
    return Math.max(0, this.windowMs - elapsed);
  }
}

/**
 * Secure session storage
 */
export const secureStorage = {
  set: (key: string, value: any): void => {
    try {
      const encrypted = btoa(JSON.stringify(value));
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Failed to store data securely:', error);
    }
  },
  
  get: (key: string): any => {
    try {
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) return null;
      
      return JSON.parse(atob(encrypted));
    } catch (error) {
      console.error('Failed to retrieve data securely:', error);
      return null;
    }
  },
  
  remove: (key: string): void => {
    sessionStorage.removeItem(key);
  },
  
  clear: (): void => {
    sessionStorage.clear();
  }
};