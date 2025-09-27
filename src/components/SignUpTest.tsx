import React from 'react';
import { useClerkAuth } from '../contexts/ClerkAuthContext';
import ClerkAuth from './ClerkAuth';

const SignUpTest: React.FC = () => {
  const { isLoaded, isSignedIn } = useClerkAuth();

  console.log('SignUpTest - isLoaded:', isLoaded, 'isSignedIn:', isSignedIn);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Already Signed In</h1>
          <p className="text-gray-600 mb-4">You are already signed in. Redirecting to dashboard...</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <ClerkAuth mode="signup" />;
};

export default SignUpTest;
