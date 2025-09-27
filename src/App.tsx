/** @jsxImportSource react */
import React from 'react';
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { ClerkAuthProvider, useClerkAuth } from './contexts/ClerkAuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContextFallback';
import ClerkAuth from './components/ClerkAuth';
import ProfileDebugger from './components/ProfileDebugger';
import OnboardingDebugger from './components/OnboardingDebugger';
import OnboardingReset from './components/OnboardingReset';
import PasswordReset from './components/PasswordReset';
import SSOCallback from './components/SSOCallback';
import SignupSuccess from './components/SignupSuccess';
import HandshakeDebug from './components/HandshakeDebug';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load components for better performance
const DashboardWrapper = lazy(() => import('./components/DashboardWrapper'));
const DevoteeRecords = lazy(() => import('./components/DevoteeRecords'));
const TempleEvents = lazy(() => import('./components/TempleEvents'));
const DevoteeManagement = lazy(() => import('./components/DevoteeManagement'));
const Profile = lazy(() => import('./components/Profile'));
const TempleSettings = lazy(() => import('./components/TempleSettings'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));

function AppContent() {
  const { user, isLoaded, isSignedIn, userProfile } = useClerkAuth();
  const { templeSettings } = useTheme();
  const [showTimeoutMessage, setShowTimeoutMessage] = React.useState(false);

  // Debug logging for handshake URLs
  const urlParams = new URLSearchParams(window.location.search);
  const hasHandshake = urlParams.has('__clerk_handshake') || urlParams.has('__clerk_handshake_token');
  
  console.log('AppContent: Current state', {
    hasHandshake,
    url: window.location.href,
    search: window.location.search,
    pathname: window.location.pathname,
    isLoaded,
    isSignedIn,
    userProfile: !!userProfile
  });

  // Show timeout message if loading takes too long
  React.useEffect(() => {
    if (!isLoaded) {
      const timeout = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, 10000); // 10 seconds
      
      return () => clearTimeout(timeout);
    } else {
      setShowTimeoutMessage(false);
    }
  }, [isLoaded]);


  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Loading your account...</p>
          {hasHandshake && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                🔄 Processing authentication handshake...
              </p>
            </div>
          )}
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

  if (!isSignedIn) {
    return (
      <div 
        className="min-h-screen"
        style={{
          backgroundColor: templeSettings?.background_color || '#FEF7ED',
          fontFamily: templeSettings?.font_family || 'Inter, sans-serif'
        }}
      >
        <Routes>
          <Route path="/sign-in" element={<ClerkAuth mode="signin" />} />
          <Route path="/sign-up" element={<ClerkAuth mode="signup" />} />
          <Route path="/signup-success" element={<SignupSuccess />} />
          <Route path="/sso-callback" element={<SSOCallback />} />
          <Route path="/debug" element={<ProfileDebugger />} />
          <Route path="/onboarding-debug" element={<OnboardingDebugger />} />
          <Route path="/onboarding-reset" element={<OnboardingReset />} />
          <Route path="*" element={<ClerkAuth mode="signin" />} />
        </Routes>
      </div>
    );
  }

  // If user is authenticated but profile is null, show loading spinner
  if (isSignedIn && !userProfile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 mb-2">Loading your profile...</p>
            <p className="text-gray-500 text-sm mb-4">Please wait while we load your information</p>
            
            <div className="mt-4 space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Refresh Page
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Debug Info:</strong> User ID: {user?.id}, Email: {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated but not approved, show pending approval message
  if (isSignedIn && userProfile && !userProfile.is_approved) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="mx-auto h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Account Pending Approval
            </h2>
            <p className="text-gray-600 mb-4">
              Your account has been created and is pending approval from an administrator. 
              You will receive an email notification once your account is approved.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                <strong>What happens next?</strong>
              </p>
              <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                <li>• An administrator will review your registration</li>
                <li>• You'll receive an email when approved</li>
                <li>• You can then sign in to access the system</li>
              </ul>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => window.location.href = '/sign-in'}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Go to Sign In
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding is now handled within the dashboard as a modal

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
            <Route path="/dashboard" element={
              <ProtectedRoute requireAuth={true} requireApproved={true}>
                <DashboardWrapper />
              </ProtectedRoute>
            } />
            <Route path="/records" element={
              <ProtectedRoute requireAuth={true} requireApproved={true}>
                <DevoteeRecords />
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute requireAuth={true} requireApproved={true}>
                <TempleEvents />
              </ProtectedRoute>
            } />
            <Route path="/devotee-management" element={
              <ProtectedRoute requireAuth={true} requireApproved={true} requireCommittee={true}>
                <DevoteeManagement />
              </ProtectedRoute>
            } />
            <Route path="/all-records" element={
              <ProtectedRoute requireAuth={true} requireApproved={true} requireCommittee={true}>
                <DevoteeRecords />
              </ProtectedRoute>
            } />
            <Route path="/all-events" element={
              <ProtectedRoute requireAuth={true} requireApproved={true} requireCommittee={true}>
                <TempleEvents />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute requireAuth={true} requireApproved={true}>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requireAuth={true} requireApproved={true} requireAdmin={true}>
                <TempleSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requireAuth={true} requireApproved={true} requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            } />
            {/* Redirect any unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </div>
  );
}

export default function App() {
  const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  // Handshake detection is now handled by Clerk's built-in mechanisms

  if (!clerkPublishableKey) {
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">Configuration Error</h1>
          <p className="text-red-600">Clerk publishable key is missing. Please check your environment variables.</p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={clerkPublishableKey}
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/signup-success"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <Router>
        <LanguageProvider>
          <ClerkAuthProvider>
            <ThemeProvider>
              <AppContent />
              <HandshakeDebug />
            </ThemeProvider>
          </ClerkAuthProvider>
        </LanguageProvider>
      </Router>
    </ClerkProvider>
  );
}