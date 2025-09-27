import React, { createContext, useContext } from 'react';

export type Language = 'en' | 'si';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation function with basic English translations
const t = (key: string, variables?: Record<string, string>): string => {
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
    'dashboard.my_records': 'My Records',
    'dashboard.records_description': 'View your devotee records',
    'dashboard.my_events': 'My Events',
    'dashboard.events_description': 'View your temple events',
    'dashboard.my_qr_code': 'My QR Code',
    'dashboard.qr_description': 'Generate and print your QR code',
    'dashboard.qr_code_section': 'QR Code',
    'dashboard.print_id_card': 'Print ID Card',
    'dashboard.quick_access': 'Quick Access',
    'dashboard.qr_help': 'Use your QR code for quick temple check-ins',
    
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
    'common.print': 'Print',
  };
  
  let translation = translations[key] || key;
  
  // Replace variables in translation
  if (variables) {
    Object.entries(variables).forEach(([varKey, varValue]) => {
      translation = translation.replace(`{${varKey}}`, varValue);
    });
  }
  
  return translation;
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
