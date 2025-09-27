import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerkAuth } from '../contexts/ClerkAuthContext';

const SSOCallback: React.FC = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded, userProfile, isProfileComplete } = useClerkAuth();
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  useEffect(() => {
    if (isLoaded && !redirectAttempted) {
      setRedirectAttempted(true);
      
      if (isSignedIn) {
        console.log('SSO callback: User is signed in, redirecting to dashboard');
        // Small delay to ensure state is fully updated
        setTimeout(() => {
          navigate('/dashboard');
        }, 100);
      } else {
        console.log('SSO callback: User not signed in, redirecting to sign-in');
        // Redirect to sign-in if not authenticated
        navigate('/sign-in');
      }
    }
  }, [isLoaded, isSignedIn, navigate, redirectAttempted]);

  // Also handle the case where user is signed in but profile is not loaded yet
  useEffect(() => {
    if (isSignedIn && isLoaded && userProfile && !redirectAttempted) {
      setRedirectAttempted(true);
      console.log('SSO callback: User profile loaded, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [isSignedIn, isLoaded, userProfile, navigate, redirectAttempted]);

  // Fallback timeout to redirect after 5 seconds if nothing else works
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!redirectAttempted) {
        console.log('SSO callback: Timeout reached, redirecting to dashboard');
        setRedirectAttempted(true);
        navigate('/dashboard');
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [navigate, redirectAttempted]);

  // Show loading while Clerk is processing the callback
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Processing Sign In...
          </h2>
          <p className="text-gray-600">
            Please wait while we complete your sign in.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SSOCallback;
