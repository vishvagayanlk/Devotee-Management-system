import React from 'react';
import { useClerkAuth } from '../contexts/ClerkAuthContext';

const DebugInfo: React.FC = () => {
  const { user, isLoaded, isSignedIn, userProfile, isProfileComplete } = useClerkAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="space-y-1">
        <div>isLoaded: {isLoaded ? 'true' : 'false'}</div>
        <div>isSignedIn: {isSignedIn ? 'true' : 'false'}</div>
        <div>user: {user ? 'exists' : 'null'}</div>
        <div>userProfile: {userProfile ? 'exists' : 'null'}</div>
        <div>isProfileComplete: {isProfileComplete ? 'true' : 'false'}</div>
        <div>URL: {window.location.href}</div>
        <div>Handshake: {new URLSearchParams(window.location.search).has('__clerk_handshake') ? 'yes' : 'no'}</div>
      </div>
    </div>
  );
};

export default DebugInfo;
