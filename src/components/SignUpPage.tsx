import React, { useEffect, useState } from 'react';
import { SignUp } from '@clerk/clerk-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContextFallback';
import { Heart, Building2 } from 'lucide-react';

const SignUpPage: React.FC = () => {
  const { templeSettings } = useTheme();
  const { t } = useLanguage();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: templeSettings?.background_color || '#FEF7ED',
        fontFamily: templeSettings?.font_family || 'Inter, sans-serif'
      }}
    >
      <div className="max-w-md w-full space-y-8">
        {/* Temple Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-text">
            {templeSettings?.temple_name || 'Temple Management System'}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {t('auth.sign_up_subtitle')}
          </p>
        </div>

        {/* Clerk SignUp Component */}
        <div className="mt-8">
          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-lg border-0",
                headerTitle: "text-text font-semibold",
                headerSubtitle: "text-muted",
                socialButtonsBlockButton: "border-theme hover:bg-theme-50",
                formButtonPrimary: "bg-primary hover:bg-primary-600 text-white",
                footerActionLink: "text-primary hover:text-primary-600",
                identityPreviewText: "text-text",
                formFieldInput: "border-theme focus:border-primary focus:ring-primary",
                formFieldLabel: "text-text font-medium",
              },
              variables: {
                colorPrimary: templeSettings?.primary_color || '#3B82F6',
                colorBackground: templeSettings?.background_color || '#FEF7ED',
                colorText: templeSettings?.text_color || '#1F2937',
                colorTextSecondary: templeSettings?.muted_color || '#6B7280',
              }
            }}
            redirectUrl="/signup-success"
            signInUrl="/sign-in"
            afterSignUpUrl="/signup-success"
          />
        </div>

        {/* Temple Footer */}
        <div className="text-center">
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

export default SignUpPage;
