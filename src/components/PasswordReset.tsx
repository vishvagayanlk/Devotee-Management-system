import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Check, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { validatePassword } from '../utils/security';
import { supabase } from '../lib/supabase';

export default function PasswordReset() {
  const { updatePassword, user, loading: authLoading } = useAuth();
  const { templeSettings } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authTimeout, setAuthTimeout] = useState(false);
  const [hasPasswordResetParams, setHasPasswordResetParams] = useState(false);

  // Immediate check for URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const type = urlParams.get('type');
    
    const hasParams = !!(accessToken || refreshToken || type === 'recovery');
    
    if (hasParams) {
      setHasPasswordResetParams(true);
      setIsAuthenticated(true);
    }
  }, []);

  // Check URL parameters for password reset
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    const type = urlParams.get('type');
    const error = urlParams.get('error');
    const errorCode = urlParams.get('error_code');
    const errorDescription = urlParams.get('error_description');
    
    
    // Check for error parameters
    if (error) {
      let errorMessage = 'Password reset link is invalid or has expired.';
      
      if (errorCode === 'otp_expired') {
        errorMessage = 'The password reset link has expired. Please request a new password reset.';
      } else if (errorCode === 'access_denied') {
        errorMessage = 'Access denied. The password reset link may be invalid or expired. This could be due to:';
        errorMessage += '\n• The link has already been used';
        errorMessage += '\n• The link has expired (valid for 1 hour)';
        errorMessage += '\n• The redirect URL is not configured in Supabase';
        errorMessage += '\n• There was an issue with the password reset request';
      } else if (errorDescription) {
        errorMessage = decodeURIComponent(errorDescription);
      }
      
      setError(errorMessage);
      return;
    }
    
    // Check if we have password reset parameters
    const hasParams = !!(accessToken || refreshToken || type === 'recovery');
    setHasPasswordResetParams(hasParams);
    
    // If we have any password reset parameters, immediately allow authentication
    if (hasParams) {
      setIsAuthenticated(true);
    }
    
    // If we have tokens but no user, try to set the session
    if ((accessToken && refreshToken) && !user && !authLoading) {
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      }).then(({ error }) => {
        if (error) {
          setError('Failed to authenticate with the password reset link. Please request a new password reset.');
        } else {
          setIsAuthenticated(true);
        }
      });
    }
  }, [user, authLoading]);

  // Check if user is authenticated for password reset
  useEffect(() => {
    if (!authLoading) {
      // Check for URL parameters that indicate password reset
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const type = urlParams.get('type');
      
      if (user) {
        // For password reset, we'll allow any authenticated user
        // The actual security is handled by Supabase's password reset flow
        setIsAuthenticated(true);
      } else if (accessToken || refreshToken || type === 'recovery') {
        // Allow password reset even without user if we have the right parameters
        setIsAuthenticated(true);
      } else if (hasPasswordResetParams) {
        // If we have any password reset parameters, allow it
        setIsAuthenticated(true);
      } else {
        // If no user, show error message
        setError('Invalid or expired password reset link. Please request a new password reset from the login page.');
      }
    }
  }, [user, authLoading, hasPasswordResetParams]);


  // Set a timeout for authentication check
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (authLoading) {
        setAuthTimeout(true);
        setError('Authentication is taking too long. Please try refreshing the page or request a new password reset.');
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [authLoading]);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setError(null);
    
    // Validate password
    const passwordValidation = validatePassword(value);
    if (!passwordValidation.isValid) {
      setPasswordErrors(prev => ({
        ...prev,
        password: passwordValidation.errors[0]
      }));
    } else {
      setPasswordErrors(prev => ({
        ...prev,
        password: undefined
      }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setError(null);
    
    if (value && value !== password) {
      setPasswordErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }));
    } else {
      setPasswordErrors(prev => ({
        ...prev,
        confirmPassword: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if we have URL parameters for password reset
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        // Set the session using the tokens from URL
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (sessionError) {
          throw sessionError;
        }
      }
      
      await updatePassword(password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    window.location.href = '/';
  };

  // Show loading state while checking authentication or if we have password reset parameters
  
  
  // Only show loading if we're actually loading auth and don't have password reset params
  if (authLoading && !authTimeout && !hasPasswordResetParams) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-2 sm:p-4" style={{
        background: `linear-gradient(135deg, ${templeSettings?.primary_color || '#FEF7ED'}, ${templeSettings?.secondary_color || '#FED7AA'})`
      }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-primary-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {hasPasswordResetParams ? 'Processing Password Reset' : 'Verifying Reset Link'}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                {hasPasswordResetParams 
                  ? 'Please wait while we process your password reset request...'
                  : 'Please wait while we verify your password reset link...'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  // If we have password reset parameters, show the form even if not fully authenticated
  if (!isAuthenticated && !hasPasswordResetParams) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-2 sm:p-4" style={{
        background: `linear-gradient(135deg, ${templeSettings?.primary_color || '#FEF7ED'}, ${templeSettings?.secondary_color || '#FED7AA'})`
      }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <X className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {authTimeout ? 'Authentication Timeout' : 'Password Reset Link Expired'}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                {authTimeout 
                  ? 'Authentication is taking too long. Please try refreshing the page or request a new password reset.'
                  : 'This password reset link has expired or is invalid. Password reset links are only valid for 1 hour for security reasons.'
                }
              </p>
              <div className="mt-6 space-y-3">
                {authTimeout && (
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Refresh Page
                  </button>
                )}
                <button
                  onClick={handleBackToLogin}
                  className="w-full bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Request New Password Reset
                </button>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Tip:</strong> Password reset links expire after 1 hour for security. If you need to reset your password, please request a new link from the login page.
                  </p>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>For Administrators:</strong> If you're getting "Access Denied" errors, please ensure that <code className="bg-blue-100 px-1 rounded">{window.location.origin}/reset-password</code> is added to the "Site URL" and "Redirect URLs" in your Supabase project settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-2 sm:p-4" style={{
        background: `linear-gradient(135deg, ${templeSettings?.primary_color || '#FEF7ED'}, ${templeSettings?.secondary_color || '#FED7AA'})`
      }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Check className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Password Updated!</h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Your password has been successfully updated. You can now sign in with your new password.
              </p>
              <button
                onClick={handleBackToLogin}
                className="mt-6 w-full bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show password reset form if authenticated OR if we have password reset parameters
  const shouldShowForm = isAuthenticated || hasPasswordResetParams;
  
  if (!shouldShowForm) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-2 sm:p-4" style={{
        background: `linear-gradient(135deg, ${templeSettings?.primary_color || '#FEF7ED'}, ${templeSettings?.secondary_color || '#FED7AA'})`
      }}>
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 lg:p-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <X className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Access Denied</h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                You need to be authenticated to reset your password.
              </p>
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
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 lg:p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-primary-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {templeSettings?.temple_name || 'Temple Committee'}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Set your new password
            </p>
            
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <X className="w-5 h-5 text-red-400 mr-2" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`appearance-none relative block w-full pl-10 pr-10 py-2 border ${
                    passwordErrors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="Enter your new password"
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
              {passwordErrors.password && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  className={`appearance-none relative block w-full pl-10 pr-10 py-2 border ${
                    passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary`}
                  placeholder="Confirm your new password"
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
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !!passwordErrors.password || !!passwordErrors.confirmPassword}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[48px]"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-primary-200 group-hover:text-primary-100" />
                </span>
                <span className="text-sm sm:text-base">
                  {loading ? 'Updating Password...' : 'Update Password'}
                </span>
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleBackToLogin}
              className="text-primary hover:text-primary-600 text-xs sm:text-sm font-medium px-2 py-1 rounded"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
