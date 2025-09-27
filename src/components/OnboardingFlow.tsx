import React, { useState, useEffect } from 'react';
import { useClerkAuth } from '../contexts/ClerkAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useOnboardingProgress } from '../hooks/useOnboardingProgress';
import { 
  UserCheck, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Building2,
  Heart,
  ArrowLeft,
  Home
} from 'lucide-react';
import UserProfileSetup from './UserProfileSetup';

const OnboardingFlow: React.FC = () => {
  const { userProfile, isProfileComplete } = useClerkAuth();
  const { templeSettings } = useTheme();
  const { t } = useLanguage();
  const { progress, getOverallProgress, isCompleted: onboardingCompleted } = useOnboardingProgress();
  const [currentStep, setCurrentStep] = useState(1);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const totalSteps = 3;

  useEffect(() => {
    // If profile is complete, redirect to dashboard
    if (isProfileComplete) {
      window.location.href = '/dashboard';
    }
  }, [isProfileComplete]);

  const handleStartProfileSetup = () => {
    setShowProfileSetup(true);
  };

  const handleProfileSetupComplete = () => {
    console.log('Profile setup completed, redirecting to dashboard');
    // Force refresh to update profile completion status
    window.location.reload();
  };

  const handleBackToWelcome = () => {
    setShowProfileSetup(false);
  };

  // If profile setup is shown, render the UserProfileSetup component
  if (showProfileSetup) {
    return (
      <div 
        className="min-h-screen"
        style={{
          backgroundColor: templeSettings?.background_color || '#FEF7ED',
          fontFamily: templeSettings?.font_family || 'Inter, sans-serif'
        }}
      >
        <div className="py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Back button */}
            <button
              onClick={handleBackToWelcome}
              className="flex items-center gap-2 text-muted hover:text-text transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Welcome
            </button>
            
            <UserProfileSetup onComplete={handleProfileSetupComplete} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: templeSettings?.background_color || '#FEF7ED',
        fontFamily: templeSettings?.font_family || 'Inter, sans-serif'
      }}
    >
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-primary-100 rounded-full flex items-center justify-center mb-6">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">
            Welcome to {templeSettings?.temple_name || 'Temple Management System'}
          </h1>
          <p className="text-muted text-lg">
            Let's get you set up with your temple profile
          </p>
        </div>

        {/* Progress Overview */}
        <div className="bg-surface rounded-lg shadow-sm border-theme p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text">Setup Progress</h2>
            <span className="text-sm text-muted">{getOverallProgress()}% Complete</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${getOverallProgress()}%` }}
            />
          </div>

          {progress.completedSteps.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>You've completed {progress.completedSteps.length} of {progress.totalSteps} steps</span>
            </div>
          )}
        </div>

        {/* Steps Overview */}
        <div className="space-y-4 mb-8">
          <div className="bg-surface rounded-lg shadow-sm border-theme p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  progress.completedSteps.includes('profile_basic_info') 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-primary-100 text-primary'
                }`}>
                  {progress.completedSteps.includes('profile_basic_info') ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">1</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-text">Basic Information</h3>
                  <p className="text-sm text-muted">Your name, email, and contact details</p>
                </div>
              </div>
              {progress.completedSteps.includes('profile_basic_info') && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
          </div>

          <div className="bg-surface rounded-lg shadow-sm border-theme p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  progress.completedSteps.includes('profile_contact_info') 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {progress.completedSteps.includes('profile_contact_info') ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">2</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-text">Contact Information</h3>
                  <p className="text-sm text-muted">Phone number and emergency contacts</p>
                </div>
              </div>
              {progress.completedSteps.includes('profile_contact_info') && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
          </div>

          <div className="bg-surface rounded-lg shadow-sm border-theme p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  progress.completedSteps.includes('profile_address_info') 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {progress.completedSteps.includes('profile_address_info') ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">3</span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-text">Address & Details</h3>
                  <p className="text-sm text-muted">Your address and additional information</p>
                </div>
              </div>
              {progress.completedSteps.includes('profile_address_info') && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleStartProfileSetup}
            className="w-full bg-primary text-white px-6 py-4 rounded-lg hover:bg-primary-600 transition-colors font-medium flex items-center justify-center gap-3 text-lg"
          >
            {progress.completedSteps.length > 0 ? 'Continue Profile Setup' : 'Start Profile Setup'}
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Refresh Page
            </button>
            
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1 bg-secondary text-white px-4 py-3 rounded-lg hover:bg-secondary-600 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              Skip to Dashboard
            </button>
          </div>
        </div>

        {/* Session persistence info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">Your progress is automatically saved</span>
          </div>
          <p className="text-blue-700 text-sm">
            You can safely refresh the page, close your browser, or come back later. 
            Your progress will be restored when you return.
          </p>
        </div>

        {/* Temple footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-2 text-muted">
            <Heart className="h-4 w-4 text-red-500" />
            <span className="text-sm">
              {t('auth.temple_footer', { temple: templeSettings?.temple_name || 'Temple' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
