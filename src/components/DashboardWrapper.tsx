import React from 'react';
import { useClerkAuth } from '../contexts/ClerkAuthContext';
import Dashboard from './Dashboard';
import DebugInfo from './DebugInfo';

const DashboardWrapper: React.FC = () => {
  const { isLoaded, isSignedIn, userProfile } = useClerkAuth();

  // Show loading while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading...
            </h2>
            <p className="text-gray-600">
              Please wait while we load your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If not signed in, redirect to sign-in
  if (!isSignedIn) {
    window.location.href = '/sign-in';
    return null;
  }

  // If profile is not loaded, show loading
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading Your Profile...
            </h2>
            <p className="text-gray-600 mb-4">
              Please wait while we load your profile information.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Dashboard />
      <DebugInfo />
    </>
  );
};

export default DashboardWrapper;