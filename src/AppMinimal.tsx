import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';

const AppMinimal: React.FC = () => {
  const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!clerkPublishableKey) {
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Configuration Error</h1>
          <p className="text-red-600">Clerk publishable key is missing.</p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Temple Management System</h1>
          <p className="text-gray-600">App is loading...</p>
        </div>
      </div>
    </ClerkProvider>
  );
};

export default AppMinimal;
