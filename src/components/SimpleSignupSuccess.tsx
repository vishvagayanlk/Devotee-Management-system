import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContextFallback';
import { CheckCircle, Clock, Building2 } from 'lucide-react';

const SimpleSignupSuccess: React.FC = () => {
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
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-text">
            {t('approval.pending_title')}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {t('approval.pending_message')}
          </p>
        </div>

        {/* Success Message */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-start space-x-3">
            <Clock className="h-6 w-6 text-yellow-500 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text mb-2">
                {t('approval.pending_title')}
              </h3>
              <p className="text-muted text-sm mb-4">
                {t('approval.pending_message')}
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>What happens next?</strong>
                </p>
                <ul className="text-yellow-700 text-sm mt-2 space-y-1">
                  <li>• An administrator will review your registration</li>
                  <li>• You'll receive an email when approved</li>
                  <li>• You can then sign in to access the system</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/sign-in'}
            className="w-full bg-primary text-white px-4 py-3 rounded-lg hover:bg-primary-600 transition-colors font-medium"
          >
            {t('auth.sign_in_subtitle')}
          </button>
          <button
            onClick={() => window.location.href = '/sign-up'}
            className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Create Another Account
          </button>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Debug Info:</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>URL: {window.location.href}</div>
            <div>Path: {window.location.pathname}</div>
            <div>Search: {window.location.search}</div>
            <div>Has Handshake: {window.location.search.includes('__clerk_handshake') ? 'Yes' : 'No'}</div>
          </div>
        </div>

        {/* Temple Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-muted">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-sm">
              {t('auth.temple_footer', { temple: templeSettings?.temple_name || 'Temple' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleSignupSuccess;
