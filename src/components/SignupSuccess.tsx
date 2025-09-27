/** @jsxImportSource react */
import React, { useEffect, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Building2 } from 'lucide-react';

const SignupSuccess: React.FC = () => {
  const { templeSettings } = useTheme();
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  // Handle handshake processing
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasHandshake = urlParams.has('__clerk_handshake') || urlParams.has('__clerk_handshake_token');
    
    console.log('SignupSuccess: Handshake check', {
      hasHandshake,
      isLoaded,
      isSignedIn,
      url: window.location.href
    });

    if (hasHandshake && isLoaded) {
      console.log('SignupSuccess: Processing handshake...');
      
      // Wait a bit for Clerk to process the handshake
      const timeout = setTimeout(() => {
        console.log('SignupSuccess: Timeout reached, checking user state...');
        console.log('SignupSuccess: isSignedIn:', isSignedIn);
        
        if (isSignedIn) {
          console.log('SignupSuccess: User signed in, redirecting to dashboard');
          navigate('/dashboard');
        } else {
          console.log('SignupSuccess: User not signed in, staying on success page');
          setIsProcessing(false);
        }
      }, 3000);

      // Also check immediately if user is already signed in
      if (isSignedIn) {
        console.log('SignupSuccess: User already signed in, redirecting immediately');
        clearTimeout(timeout);
        navigate('/dashboard');
      }

      return () => clearTimeout(timeout);
    } else if (isLoaded) {
      console.log('SignupSuccess: No handshake, user state:', isSignedIn);
      setIsProcessing(false);
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Processing your sign-up...</p>
          <p className="text-sm text-gray-500 mb-4">Please wait while we complete your registration</p>
          <button
            onClick={() => {
              console.log('SignupSuccess: Manual refresh clicked');
              window.location.reload();
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: templeSettings?.background_color || '#FEF7ED',
        fontFamily: templeSettings?.font_family || 'Inter, sans-serif'
      }}
    >
      <div className="max-w-md w-full space-y-8">
        {/* Temple Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-text">
            Registration Successful!
          </h2>
          <p className="mt-2 text-sm text-muted">
            Your account has been created successfully
          </p>
        </div>

        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start space-x-3">
            <Clock className="h-6 w-6 text-yellow-500 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text mb-2">
                Account Pending Approval
              </h3>
              <p className="text-muted text-sm mb-4">
                Your account has been created and is now pending approval from an administrator. 
                You will receive an email notification once your account is approved.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>What happens next?</strong>
                </p>
                <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                  <li>• An administrator will review your registration</li>
                  <li>• You'll receive an email when approved</li>
                  <li>• You can then sign in to access the system</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/sign-in'}
            className="w-full bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary-600 transition-colors font-medium"
          >
            Go to Sign In
          </button>
          <button
            onClick={() => window.location.href = '/sign-up'}
            className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Create Another Account
          </button>
        </div>

        {/* Temple Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-muted">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-sm">
              {templeSettings?.temple_name || 'Temple Management System'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupSuccess;
