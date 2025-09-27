import React from 'react';

const SimpleSignUp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign Up Test</h1>
        <p className="text-gray-600 mb-4">
          This is a simple test page to verify that routing is working on Vercel.
        </p>
        <div className="space-y-2">
          <p><strong>Current URL:</strong> {window.location.href}</p>
          <p><strong>Current Path:</strong> {window.location.pathname}</p>
          <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
        </div>
        <div className="mt-6">
          <a
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default SimpleSignUp;
