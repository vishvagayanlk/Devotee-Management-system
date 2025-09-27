/** @jsxImportSource react */
import React from 'react';
import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import { ClerkAuthProvider, useClerkAuth } from './contexts/ClerkAuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContextFallback';
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
import ClerkIntegrationTest from './components/ClerkIntegrationTest';

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
  const { t } = useLanguage();
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
          <Route path="/clerk-test" element={<ClerkIntegrationTest />} />
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

  // If user is authenticated but not approved, show dashboard with limited access
  if (isSignedIn && userProfile && !userProfile.is_approved) {
    return (
      <div 
        className="min-h-screen"
        style={{
          backgroundColor: templeSettings?.background_color || '#FEF7ED',
          fontFamily: templeSettings?.font_family || 'Inter, sans-serif'
        }}
      >
        <Layout>
          <div className="p-6">
            {/* Pending Approval Banner */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    {t('approval.pending_title')}
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>{t('approval.pending_message')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Limited Dashboard Content */}
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('approval.welcome', { name: userProfile.full_name })}
                </h1>
                <p className="text-gray-600">
                  {t('approval.review_message')}
                </p>
              </div>

              {/* Limited Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 ml-3">{t('nav.profile')}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    {t('approval.profile_description')}
                  </p>
                  <button
                    onClick={() => window.location.href = '/profile'}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    {t('approval.view_profile')}
                  </button>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 ml-3">{t('common.status')}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    {t('approval.status_description')}
                  </p>
                  <div className="text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">{t('common.status')}:</span>
                      <span className="text-yellow-600 font-medium">{t('approval.pending')}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">{t('common.role')}:</span>
                      <span className="text-gray-700 capitalize">{userProfile.role === 'devotee' ? t('user.devotee') : userProfile.role === 'committee' ? t('user.committee_member') : t('user.admin')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('approval.email')}:</span>
                      <span className="text-gray-700 text-xs">{userProfile.email}</span>
                    </div>
                  </div>
                </div>

                {/* Help Card */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 ml-3">උදව්</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    {t('approval.help_description')}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    {t('approval.refresh_status')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Layout>
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