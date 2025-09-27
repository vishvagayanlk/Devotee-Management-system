import React from 'react';
import { useLocation } from 'react-router-dom';

const RouteTest: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Route Test</h1>
        <div className="space-y-2">
          <p><strong>Current Path:</strong> {location.pathname}</p>
          <p><strong>Current Search:</strong> {location.search}</p>
          <p><strong>Current Hash:</strong> {location.hash}</p>
          <p><strong>Current URL:</strong> {window.location.href}</p>
        </div>
        <div className="mt-6 space-x-2">
          <a
            href="/sign-up"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Sign Up
          </a>
          <a
            href="/sign-in"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Go to Sign In
          </a>
        </div>
      </div>
    </div>
  );
};

export default RouteTest;
