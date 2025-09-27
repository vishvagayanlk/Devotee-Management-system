import React, { createContext, useContext } from 'react';

export type Language = 'en' | 'si';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation function with basic English translations
const t = (key: string): string => {
  const translations: Record<string, string> = {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.records': 'Records',
    'nav.events': 'Events',
    'nav.profile': 'Profile',
    'nav.settings': 'Settings',
    'nav.devotee_management': 'Devotee Management',
    'nav.all_records': 'All Records',
    'nav.all_events': 'All Events',
    
    // Auth
    'auth.sign_in_subtitle': 'Sign in to your account',
    'auth.sign_up_subtitle': 'Create your account',
    'auth.temple_footer': 'Made with ❤️ for {temple}',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.committee_title': 'Committee Dashboard',
    'dashboard.welcome': 'Welcome back,',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.close': 'Close',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.finish': 'Finish',
    'common.continue': 'Continue',
    'common.refresh': 'Refresh',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.role': 'Role',
    'common.created_at': 'Created',
    'common.updated_at': 'Updated',
  };
  
  return translations[key] || key;
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const value: LanguageContextType = {
    language: 'en',
    setLanguage: () => {}, // No-op
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if context is not available
    console.warn('useLanguage called outside of LanguageProvider, using fallback');
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t
    };
  }
  return context;
}
