import React from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Heart, Building2 } from 'lucide-react';

interface ClerkAuthProps {
  mode?: 'signin' | 'signup';
}

export default function ClerkAuth({ mode = 'signin' }: ClerkAuthProps) {
  const { templeSettings } = useTheme();
  const { t } = useLanguage();

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
            {mode === 'signin' ? t('auth.sign_in_subtitle') : t('auth.sign_up_subtitle')}
          </p>
        </div>

        {/* Clerk Auth Component */}
        <div className="mt-8">
          {mode === 'signin' ? (
            <SignIn 
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
              redirectUrl="/dashboard"
              signUpUrl="/sign-up"
            />
          ) : (
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
            />
          )}
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
}
