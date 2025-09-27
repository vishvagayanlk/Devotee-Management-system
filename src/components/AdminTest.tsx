import React, { useState, useEffect } from 'react';
import { isAdminEmail, getAdminRole, getAdminStatus, getAdminApproval } from '../config/adminConfig';

const AdminTest: React.FC = () => {
  const [testEmail, setTestEmail] = useState('admin@temple.com');
  const [results, setResults] = useState<any>(null);
  const [envVars, setEnvVars] = useState<any>(null);

  useEffect(() => {
    // Check environment variables
    const env = {
      'import.meta.env.VITE_ADMIN_EMAILS': import.meta?.env?.VITE_ADMIN_EMAILS,
      'import.meta.env.VITE_ADMIN_DOMAINS': import.meta?.env?.VITE_ADMIN_DOMAINS,
      'import.meta.env.VITE_ADMIN_PATTERNS': import.meta?.env?.VITE_ADMIN_PATTERNS,
      'import.meta.env.VITE_SUPER_ADMIN_EMAILS': import.meta?.env?.VITE_SUPER_ADMIN_EMAILS,
      'process.env.VITE_ADMIN_EMAILS': process?.env?.VITE_ADMIN_EMAILS,
      'process.env.VITE_ADMIN_DOMAINS': process?.env?.VITE_ADMIN_DOMAINS,
      'process.env.VITE_ADMIN_PATTERNS': process?.env?.VITE_ADMIN_PATTERNS,
      'process.env.VITE_SUPER_ADMIN_EMAILS': process?.env?.VITE_SUPER_ADMIN_EMAILS,
    };
    setEnvVars(env);
  }, []);

  const testAdminDetection = () => {
    try {
      const results = {
        email: testEmail,
        isAdmin: isAdminEmail(testEmail),
        role: getAdminRole(testEmail),
        status: getAdminStatus(testEmail),
        approval: getAdminApproval(testEmail),
      };
      setResults(results);
    } catch (error) {
      setResults({ error: error.message });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Detection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2">
            {envVars && Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded w-64">{key}:</span>
                <span className="font-mono text-sm ml-2">{String(value) || 'undefined'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Admin Detection</h2>
          <div className="flex gap-4 mb-4">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email to test"
            />
            <button
              onClick={testAdminDetection}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Test
            </button>
          </div>
          
          {results && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-semibold mb-2">Results for {results.email}:</h3>
              {results.error ? (
                <div className="text-red-600">Error: {results.error}</div>
              ) : (
                <div className="space-y-1">
                  <div><strong>isAdmin:</strong> {results.isAdmin ? '✅ Yes' : '❌ No'}</div>
                  <div><strong>Role:</strong> {results.role}</div>
                  <div><strong>Status:</strong> {results.status}</div>
                  <div><strong>Approval:</strong> {results.approval ? '✅ Approved' : '❌ Not Approved'}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Tests</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              'admin@temple.com',
              'user@temple.com',
              'manager@company.com',
              'admin@other.com',
              'superadmin@temple.com',
              'user@other.com'
            ].map(email => (
              <button
                key={email}
                onClick={() => {
                  setTestEmail(email);
                  testAdminDetection();
                }}
                className="p-3 text-left border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <div className="font-medium">{email}</div>
                <div className="text-sm text-gray-600">
                  {isAdminEmail(email) ? 'Admin' : 'Not Admin'}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTest;
