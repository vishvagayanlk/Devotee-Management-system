import React, { useState, useEffect } from 'react';
import { Shield, User, Mail, Lock, UserPlus, LogIn, MapPin, Phone, CreditCard, Eye, EyeOff, Bug, Building2, Check, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { validateNIC, validatePhoneNumber, validateEmail, validatePassword, RateLimiter } from '../utils/security';
import { supabase, Database } from '../lib/supabase';

type Group = Database['public']['Tables']['groups']['Row'];

// Rate limiter for login attempts
const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 minutes

export default function Auth() {
  const { signUp, signIn, testDatabaseTrigger, resetPassword } = useAuth();
  const { templeSettings } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  
  // Debug: Monitor state changes
  useEffect(() => {
    console.log('Auth: State changed - showForgotPassword:', showForgotPassword, 'forgotPasswordSuccess:', forgotPasswordSuccess, 'forgotPasswordLoading:', forgotPasswordLoading);
  }, [showForgotPassword, forgotPasswordSuccess, forgotPasswordLoading]);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    nicNumber: '',
    address: '',
    phone: '',
    confirmPassword: '',
    groupId: '',
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Fetch groups on component mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .order('name');

        if (error) throw error;
        setGroups(data || []);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
    };

    fetchGroups();
  }, []);

  // Validation functions
  const validateEmailField = (email: string): string | null => {
    if (!email) return 'Email is required';
    if (!validateEmail(email)) return 'Please enter a valid email address';
    return null;
  };

  const validatePasswordField = (password: string): string | null => {
    if (isLogin) {
      return !password ? 'Password is required' : null;
    }
    
    const validation = validatePassword(password);
    return validation.isValid ? null : validation.errors[0];
  };

  const validateNICField = (nic: string): string | null => {
    if (!nic) return 'NIC number is required';
    if (!validateNIC(nic)) {
      return 'Please enter a valid Sri Lankan NIC number';
    }
    return null;
  };

  const validatePhoneField = (phone: string): string | null => {
    if (!phone) return 'Phone number is required';
    if (!validatePhoneNumber(phone)) {
      return 'Please enter a valid Sri Lankan phone number (e.g., 0771234567 or +94771234567)';
    }
    return null;
  };

  const validateFullName = (name: string): string | null => {
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Full name must be at least 2 characters';
    if (!/^[a-zA-Z\s.]+$/.test(name)) return 'Full name can only contain letters, spaces, and periods';
    return null;
  };

  const validateAddress = (address: string): string | null => {
    if (!address.trim()) return 'Address is required';
    if (address.trim().length < 10) return 'Please provide a complete address';
    return null;
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    // Email validation
    const emailError = validateEmailField(formData.email);
    if (emailError) errors.email = emailError;

    // Password validation
    const passwordError = validatePasswordField(formData.password);
    if (passwordError) errors.password = passwordError;

    if (!isLogin) {
      // Full name validation
      const nameError = validateFullName(formData.fullName);
      if (nameError) errors.fullName = nameError;

      // NIC validation
      const nicError = validateNICField(formData.nicNumber);
      if (nicError) errors.nicNumber = nicError;

      // Phone validation
      const phoneError = validatePhoneField(formData.phone);
      if (phoneError) errors.phone = phoneError;

      // Address validation
      const addressError = validateAddress(formData.address);
      if (addressError) errors.address = addressError;

      // Confirm password validation
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: '' });
    }
    // Clear general error
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting for login attempts
    if (isLogin) {
      const identifier = formData.email.toLowerCase();
      if (!loginRateLimiter.isAllowed(identifier)) {
        const remainingTime = Math.ceil(loginRateLimiter.getRemainingTime(identifier) / 1000 / 60);
        setError(`Too many login attempts. Please try again in ${remainingTime} minutes.`);
        return;
      }
    }
    
    if (!validateForm()) {
      setError('Please correct the errors below');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        await signUp(
          formData.email, 
          formData.password, 
          formData.fullName, 
          formData.nicNumber, 
          formData.address, 
          formData.phone,
          formData.groupId
        );
        
        // Show success screen after successful signup
        setSignupEmail(formData.email);
        setSignupSuccess(true);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Handle specific error messages
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (err.message?.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link before signing in.');
      } else if (err.message?.includes('User already registered')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.message?.includes('Password should be at least')) {
        setError('Password must be at least 6 characters long.');
      } else if (err.message?.includes('Unable to validate email address')) {
        setError('Please enter a valid email address.');
      } else if (err.message?.includes('Signup is disabled')) {
        setError('New registrations are currently disabled. Please contact the temple committee.');
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setFieldErrors({});
    setShowForgotPassword(false);
    setForgotPasswordSuccess(false);
    setSignupSuccess(false);
    setSignupEmail('');
    setFormData({
      email: '',
      password: '',
      fullName: '',
      nicNumber: '',
      address: '',
      phone: '',
      confirmPassword: '',
      groupId: '',
    });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!forgotPasswordEmail.trim()) {
      setError('Please enter your email address');
      return;
    }

    console.log('handleForgotPassword: Starting password reset process');
    console.log('handleForgotPassword: Current state - showForgotPassword:', showForgotPassword, 'forgotPasswordSuccess:', forgotPasswordSuccess);
    
    setForgotPasswordLoading(true);
    setError(null);

    try {
      console.log('Sending password reset email to:', forgotPasswordEmail);
      await resetPassword(forgotPasswordEmail);
      console.log('Password reset email sent successfully');
      console.log('handleForgotPassword: Setting success state to true');
      setForgotPasswordSuccess(true);
      console.log('handleForgotPassword: Success state set, showForgotPassword should still be true');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setForgotPasswordSuccess(false);
    setForgotPasswordEmail('');
    setError(null);
  };

  const runDebugTest = async () => {
    setDebugInfo('Running debug test...');
    try {
      // Test Supabase connection
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      let debugOutput = `Supabase URL: ${supabaseUrl ? 'Set' : 'Missing'}\n`;
      debugOutput += `Supabase Key: ${supabaseKey ? 'Set' : 'Missing'}\n\n`;
      
      if (!supabaseUrl || !supabaseKey) {
        debugOutput += 'ERROR: Missing Supabase environment variables!\n';
        setDebugInfo(debugOutput);
        return;
      }
      
      // Test database connection using the existing auth context
      debugOutput += 'Testing database connection...\n';
      const dbTest = await testDatabaseTrigger();
      debugOutput += `Database test: ${dbTest ? 'PASSED' : 'FAILED'}\n`;
      
      setDebugInfo(debugOutput);
    } catch (err: any) {
      setDebugInfo(`Debug test failed: ${err.message}`);
    }
  };

  // Show forgot password success screen
  if (forgotPasswordSuccess) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-2 sm:p-4" style={{
        background: `linear-gradient(135deg, ${templeSettings?.primary_color || '#FEF7ED'}, ${templeSettings?.secondary_color || '#FED7AA'})`
      }}>
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Password Reset Sent!
              </h2>
              
              <div className="space-y-4">
                <p className="text-gray-600 text-sm sm:text-base">
                  We've sent a password reset link to:
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900 break-all">
                    {forgotPasswordEmail}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">Check your inbox</p>
                      <p className="text-xs text-gray-600">Click the reset link in the email to create a new password</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">Link expires</p>
                      <p className="text-xs text-gray-600">The reset link is valid for 24 hours</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setForgotPasswordSuccess(false);
                      setForgotPasswordEmail('');
                      setShowForgotPassword(false);
                    }}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    style={{
                      backgroundColor: templeSettings?.primary_color || '#F97316'
                    }}
                  >
                    Back to Login
                  </button>
                </div>
                
                <div className="text-xs text-gray-500">
                  <p>Didn't receive the email? Check your spam folder or try again.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show signup success screen
  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-2 sm:p-4" style={{
        background: `linear-gradient(135deg, ${templeSettings?.primary_color || '#FEF7ED'}, ${templeSettings?.secondary_color || '#FED7AA'})`
      }}>
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Registration Successful!
              </h2>
              
              <div className="space-y-4">
                <p className="text-gray-600 text-sm sm:text-base">
                  Thank you for registering with our temple! We've sent a confirmation email to:
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900 break-all">
                    {signupEmail}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">Check your inbox</p>
                      <p className="text-xs text-gray-600">Click the confirmation link in the email to verify your email address</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">Email verification</p>
                      <p className="text-xs text-gray-600">Confirm your email address first</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">Account approval</p>
                      <p className="text-xs text-gray-600">Your account will be reviewed by the temple committee</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">Access granted</p>
                      <p className="text-xs text-gray-600">You'll receive access once approved</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button
                    onClick={() => {
                      setSignupSuccess(false);
                      setSignupEmail('');
                      setIsLogin(true);
                    }}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    style={{
                      backgroundColor: templeSettings?.primary_color || '#F97316'
                    }}
                  >
                    Back to Login
                  </button>
                </div>
                
                <div className="text-xs text-gray-500">
                  <p>Didn't receive the email? Check your spam folder or contact the temple committee.</p>
                  <p className="mt-1"><strong>Note:</strong> You must confirm your email before your account can be reviewed by the committee.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-2 sm:p-4" style={{
      background: `linear-gradient(135deg, ${templeSettings?.primary_color || '#FEF7ED'}, ${templeSettings?.secondary_color || '#FED7AA'})`
    }}>
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 lg:p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-primary-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {templeSettings?.temple_name || 'Temple Devotee Committee'}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              {templeSettings?.temple_description || (isLogin ? 'Sign in to temple system' : 'Register as temple devotee')}
            </p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="space-y-3 sm:space-y-4">
              {!isLogin && (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="fullName"
                      type="text"
                      required={!isLogin}
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className={`appearance-none relative block w-full pl-10 px-3 py-2 border ${
                        fieldErrors.fullName ? 'border-red-300' : 'border-gray-300'
                      } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.fullName}</p>
                  )}
                </div>
              )}

              {!isLogin && (
                <div>
                  <label htmlFor="nicNumber" className="block text-sm font-medium text-gray-700">
                    NIC Number *
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="nicNumber"
                      type="text"
                      required={!isLogin}
                      value={formData.nicNumber}
                      onChange={(e) => handleInputChange('nicNumber', e.target.value.toUpperCase())}
                      className={`appearance-none relative block w-full pl-10 px-3 py-2 border ${
                        fieldErrors.nicNumber ? 'border-red-300' : 'border-gray-300'
                      } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                      placeholder="e.g., 123456789V or 200012345678"
                    />
                  </div>
                  {fieldErrors.nicNumber && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.nicNumber}</p>
                  )}
                </div>
              )}

              {!isLogin && (
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address *
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 pt-2 flex items-start pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="address"
                      rows={2}
                      required={!isLogin}
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={`appearance-none relative block w-full pl-10 px-3 py-2 border ${
                        fieldErrors.address ? 'border-red-300' : 'border-gray-300'
                      } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 resize-none`}
                      placeholder="Enter your complete address"
                    />
                  </div>
                  {fieldErrors.address && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>
                  )}
                </div>
              )}

              {!isLogin && (
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      required={!isLogin}
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`appearance-none relative block w-full pl-10 px-3 py-2 border ${
                        fieldErrors.phone ? 'border-red-300' : 'border-gray-300'
                      } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                      placeholder="e.g., 0771234567"
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
                    className={`appearance-none relative block w-full pl-10 px-3 py-2 border ${
                      fieldErrors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                    placeholder="Enter your email address"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`appearance-none relative block w-full pl-10 pr-10 px-3 py-2 border ${
                      fieldErrors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                    placeholder={isLogin ? 'Enter your password' : 'Create a strong password'}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
                )}
                {!isLogin && !fieldErrors.password && (
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters with uppercase, lowercase, and number
                  </p>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password *
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required={!isLogin}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`appearance-none relative block w-full pl-10 pr-10 px-3 py-2 border ${
                        fieldErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              {!isLogin && (
                <div>
                  <label htmlFor="groupId" className="block text-sm font-medium text-gray-700">
                    Select Group (Optional)
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      id="groupId"
                      value={formData.groupId}
                      onChange={(e) => handleInputChange('groupId', e.target.value)}
                      className="appearance-none relative block w-full pl-10 pr-10 px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">No Group Selected</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose a group to join. You can change this later in your profile.
                  </p>
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px]"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  {isLogin ? (
                    <LogIn className="h-4 w-4 sm:h-5 sm:w-5 text-primary-200 group-hover:text-primary-100" />
                  ) : (
                    <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-primary-200 group-hover:text-primary-100" />
                  )}
                </span>
                <span className="text-sm sm:text-base">
                  {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Register as Devotee'}
                </span>
              </button>
            </div>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={toggleMode}
                className="text-primary hover:text-primary-600 text-xs sm:text-sm font-medium px-2 py-1 rounded"
              >
                {isLogin
                  ? "Don't have an account? Register as devotee"
                  : 'Already registered? Sign in'}
              </button>
              {isLogin && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm font-medium px-2 py-1 rounded"
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </div>
          </form>

          {!isLogin && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-orange-700 text-xs sm:text-sm">
                <strong>Temple Registration:</strong> After registering as a devotee, your account will be pending until a committee member reviews and approves your registration. You'll be notified once your devotee status is activated.
              </p>
            </div>
          )}


          {/* Debug Section */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs sm:text-sm font-medium text-gray-700">Debug Information</h3>
              <button
                type="button"
                onClick={() => setShowDebug(!showDebug)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <Bug className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
            {showDebug && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={runDebugTest}
                  className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                >
                  Run Debug Test
                </button>
                {debugInfo && (
                  <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-24 sm:max-h-32">
                    {debugInfo}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  handleBackToLogin();
                }
              }}
            >
              <div 
                className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-primary-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                    <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Reset Password</h2>
                  <p className="mt-2 text-sm sm:text-base text-gray-600">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                </div>

                {/* Debug info - remove in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                    <p>Debug: Success={forgotPasswordSuccess.toString()}, Loading={forgotPasswordLoading.toString()}</p>
                    <p>Debug: showForgotPassword={showForgotPassword.toString()}, forgotPasswordEmail={forgotPasswordEmail}</p>
                  </div>
                )}

                {forgotPasswordSuccess ? (
                  <div className="mt-6 text-center">
                    <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">Password Reset Email Sent!</h3>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <p className="text-sm text-green-800 mb-2">
                        <strong>We've sent a password reset link to:</strong>
                      </p>
                      <p className="text-sm font-medium text-green-900 mb-3">
                        {forgotPasswordEmail}
                      </p>
                      <div className="text-xs text-green-700 space-y-1">
                        <p>• Check your email inbox (and spam folder)</p>
                        <p>• Click the link in the email to reset your password</p>
                        <p>• The link will expire in 1 hour for security</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={handleBackToLogin}
                        className="w-full bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Back to Sign In
                      </button>
                      <button
                        onClick={() => {
                          setForgotPasswordSuccess(false);
                          setForgotPasswordEmail('');
                          setError(null);
                        }}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                      >
                        Send Another Email
                      </button>
                      <p className="text-xs text-gray-500">
                        Didn't receive the email? Check your spam folder or try sending again.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form className="mt-6 space-y-4" onSubmit={handleForgotPassword}>
                    <div>
                      <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <div className="mt-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="forgotEmail"
                          type="email"
                          required
                          value={forgotPasswordEmail}
                          onChange={(e) => setForgotPasswordEmail(e.target.value)}
                          className="appearance-none relative block w-full pl-10 px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary"
                          placeholder="Enter your email address"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={handleBackToLogin}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotPasswordLoading}
                        className="flex-1 bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {forgotPasswordLoading && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        <span>{forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}