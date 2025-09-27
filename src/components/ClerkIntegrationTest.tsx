import React, { useState, useEffect } from 'react';
import { useClerkAuth } from '../contexts/ClerkAuthContext';
import { runClerkTests, checkClerkConfiguration } from '../utils/clerkIntegrationTest';

const ClerkIntegrationTest: React.FC = () => {
  const { user, isLoaded, isSignedIn, userProfile } = useClerkAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    // Check configuration first
    const configCheck = checkClerkConfiguration();
    const configResults = [
      '🔧 Configuration Check:',
      configCheck.isValid ? '✅ Configuration is valid' : '❌ Configuration issues found:',
      ...configCheck.issues.map(issue => `  - ${issue}`),
      ''
    ];

    // Run integration tests
    const { passed, failed, results } = runClerkTests();
    const testSummary = [
      `📊 Test Results: ${passed} passed, ${failed} failed`,
      ''
    ];

    setTestResults([...configResults, ...results, ...testSummary]);
    setIsRunning(false);
  };

  const currentState = {
    isLoaded,
    isSignedIn,
    userProfile: userProfile ? {
      id: userProfile.id,
      email: userProfile.email,
      full_name: userProfile.full_name,
      role: userProfile.role,
      is_approved: userProfile.is_approved,
      status: userProfile.status
    } : null,
    clerkUser: user ? {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      fullName: user.fullName
    } : null
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Clerk Integration Test</h1>
        
        {/* Current State Display */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Current Authentication State</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Clerk State:</h3>
              <pre className="text-sm text-gray-600 mt-1">
                {JSON.stringify({
                  isLoaded,
                  isSignedIn,
                  hasUser: !!user
                }, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">User Profile:</h3>
              <pre className="text-sm text-gray-600 mt-1">
                {JSON.stringify(currentState.userProfile, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="mb-6">
          <button
            onClick={runTests}
            disabled={isRunning}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running Tests...' : 'Run Integration Tests'}
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Test Results</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
              {testResults.map((result, index) => (
                <div key={index}>{result}</div>
              ))}
            </div>
          </div>
        )}

        {/* Integration Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Clerk Provider</h3>
            <div className="flex items-center">
              {import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ? (
                <span className="text-green-600">✅ Configured</span>
              ) : (
                <span className="text-red-600">❌ Missing Key</span>
              )}
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Auth Context</h3>
            <div className="flex items-center">
              {isLoaded ? (
                <span className="text-green-600">✅ Loaded</span>
              ) : (
                <span className="text-yellow-600">⏳ Loading</span>
              )}
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">User State</h3>
            <div className="flex items-center">
              {isSignedIn ? (
                <span className="text-green-600">✅ Signed In</span>
              ) : (
                <span className="text-gray-600">❌ Not Signed In</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Quick Actions</h3>
          <div className="space-x-2">
            <button
              onClick={() => window.location.href = '/sign-in'}
              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Go to Sign In
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClerkIntegrationTest;
