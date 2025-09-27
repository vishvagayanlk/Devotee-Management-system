import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Auth from './components/Auth';
import PasswordReset from './components/PasswordReset';
import Layout from './components/Layout';

// Lazy load components for better performance
const Dashboard = lazy(() => import('./components/Dashboard'));
const DevoteeRecords = lazy(() => import('./components/DevoteeRecords'));
const TempleEvents = lazy(() => import('./components/TempleEvents'));
const DevoteeManagement = lazy(() => import('./components/DevoteeManagement'));
const Profile = lazy(() => import('./components/Profile'));
const TempleSettings = lazy(() => import('./components/TempleSettings'));

function AppContent() {
  const { user, loading, profile, debugRoles } = useAuth();
  const { templeSettings } = useTheme();
  const [showTimeoutMessage, setShowTimeoutMessage] = React.useState(false);


  // Show timeout message if loading takes too long
  React.useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timeout);
    } else {
      setShowTimeoutMessage(false);
    }
  }, [loading]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Loading your account...</p>
          {showTimeoutMessage && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                Loading is taking longer than expected. 
                <button 
                  onClick={() => window.location.reload()} 
                  className="text-blue-600 hover:text-blue-800 underline ml-1"
                >
                  Refresh the page
                </button> if this continues.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check if this is a password reset flow (regardless of user state)
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get('access_token');
  const refreshToken = urlParams.get('refresh_token');
  const type = urlParams.get('type');
  const error = urlParams.get('error');
  const isPasswordResetFlow = accessToken || refreshToken || type === 'recovery' || error || window.location.pathname === '/reset-password';
  
  // If we detect password reset parameters, show password reset page
  if (isPasswordResetFlow) {
    return (
      <div 
        className="min-h-screen"
        style={{
          backgroundColor: templeSettings?.background_color || '#FEF7ED',
          fontFamily: templeSettings?.font_family || 'Inter, sans-serif'
        }}
      >
        <Routes>
          <Route path="/reset-password" element={<PasswordReset />} />
          <Route path="*" element={<PasswordReset />} />
        </Routes>
      </div>
    );
  }

  if (!user) {
    return (
      <div 
        className="min-h-screen"
        style={{
          backgroundColor: templeSettings?.background_color || '#FEF7ED',
          fontFamily: templeSettings?.font_family || 'Inter, sans-serif'
        }}
      >
        <Routes>
          <Route path="*" element={<Auth />} />
        </Routes>
      </div>
    );
  }

  // If user is authenticated but profile is null, show loading spinner
  if (user && !profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 mb-2">Loading your profile...</p>
            <p className="text-gray-500 text-sm mb-4">Please wait while we load your information</p>
            
            <div className="mt-4 space-y-2">
              <button
                onClick={() => debugRoles()}
                className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
              >
                Debug Roles (Check Console)
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Refresh Page
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Debug Info:</strong> User ID: {user?.id}, Email: {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundColor: templeSettings?.background_color || '#FEF7ED',
        fontFamily: templeSettings?.font_family || 'Inter, sans-serif'
      }}
    >
      <Layout>
        <Suspense fallback={
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/records" element={<DevoteeRecords />} />
            <Route path="/events" element={<TempleEvents />} />
            <Route path="/devotee-management" element={<DevoteeManagement />} />
            <Route path="/all-records" element={<DevoteeRecords />} />
            <Route path="/all-events" element={<TempleEvents />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<TempleSettings />} />
            {/* Redirect any unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}