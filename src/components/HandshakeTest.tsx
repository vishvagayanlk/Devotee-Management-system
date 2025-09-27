import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

const HandshakeTest: React.FC = () => {
  const { isLoaded, isSignedIn, user } = useAuth();
  const [handshakeInfo, setHandshakeInfo] = useState<any>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasHandshake = urlParams.has('__clerk_handshake');
    const hasHandshakeToken = urlParams.has('__clerk_handshake_token');
    const handshakeToken = urlParams.get('__clerk_handshake');
    const handshakeTokenParam = urlParams.get('__clerk_handshake_token');

    setHandshakeInfo({
      hasHandshake,
      hasHandshakeToken,
      handshakeToken: handshakeToken ? 'Present' : 'Missing',
      handshakeTokenParam: handshakeTokenParam ? 'Present' : 'Missing',
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Handshake Test</h1>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Handshake Detection</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Has Handshake:</strong> {handshakeInfo?.hasHandshake ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Has Handshake Token:</strong> {handshakeInfo?.hasHandshakeToken ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Handshake Token:</strong> {handshakeInfo?.handshakeToken}</div>
              <div><strong>Handshake Token Param:</strong> {handshakeInfo?.handshakeTokenParam}</div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-green-900 mb-2">Clerk State</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Is Loaded:</strong> {isLoaded ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Is Signed In:</strong> {isSignedIn ? '✅ Yes' : '❌ No'}</div>
              <div><strong>User ID:</strong> {user?.id || 'None'}</div>
              <div><strong>User Email:</strong> {user?.emailAddresses?.[0]?.emailAddress || 'None'}</div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-900 mb-2">URL Information</h2>
            <div className="space-y-2 text-sm">
              <div><strong>Current URL:</strong> {handshakeInfo?.url}</div>
              <div><strong>Pathname:</strong> {handshakeInfo?.pathname}</div>
              <div><strong>Search:</strong> {handshakeInfo?.search}</div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => window.location.href = '/sign-up'}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Go to Sign Up
            </button>
            <button
              onClick={() => window.location.href = '/signup-success'}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Go to Success Page
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HandshakeTest;
