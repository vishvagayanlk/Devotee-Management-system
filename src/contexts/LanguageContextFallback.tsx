import React, { createContext, useContext } from 'react';

export type Language = 'en' | 'si';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation function with English and Sinhala translations
const t = (key: string, variables?: Record<string, string>, currentLanguage: Language = 'si'): string => {
  const translations: Record<string, Record<string, string>> = {
    // Navigation
    'nav.dashboard': {
      en: 'Dashboard',
      si: 'ප්‍රධාන පිටුව'
    },
    'nav.records': {
      en: 'Records',
      si: 'ලියාපදිංචි'
    },
    'nav.events': {
      en: 'Events',
      si: 'සිදුවීම්'
    },
    'nav.profile': {
      en: 'Profile',
      si: 'පැතිකඩ'
    },
    'nav.settings': {
      en: 'Settings',
      si: 'සැකසුම්'
    },
    'nav.devotee_management': {
      en: 'Devotee Management',
      si: 'භක්තිකයන් කළමනාකරණය'
    },
    'nav.all_records': {
      en: 'All Records',
      si: 'සියලුම ලියාපදිංචි'
    },
    'nav.all_events': {
      en: 'All Events',
      si: 'සියලුම සිදුවීම්'
    },
    
    // Auth
    'auth.sign_in_subtitle': {
      en: 'Sign in to your account',
      si: 'ඔබේ ගිණුමට පිවිසෙන්න'
    },
    'auth.sign_up_subtitle': {
      en: 'Create your account',
      si: 'ඔබේ ගිණුම සාදන්න'
    },
    'auth.temple_footer': {
      en: 'Made with ❤️ for {temple}',
      si: '{temple} සඳහා ❤️ සමඟ සාදන ලදී'
    },
    
    // Dashboard
    'dashboard.title': {
      en: 'Dashboard',
      si: 'ප්‍රධාන පිටුව'
    },
    'dashboard.committee_title': {
      en: 'Committee Dashboard',
      si: 'කමිටු ප්‍රධාන පිටුව'
    },
    'dashboard.welcome': {
      en: 'Welcome back,',
      si: 'නැවත සාදරයෙන් පිළිගනිමු,'
    },
    'dashboard.my_records': {
      en: 'My Records',
      si: 'මගේ ලියාපදිංචි'
    },
    'dashboard.records_description': {
      en: 'View your devotee records',
      si: 'ඔබේ භක්තික ලියාපදිංචි බලන්න'
    },
    'dashboard.my_events': {
      en: 'My Events',
      si: 'මගේ සිදුවීම්'
    },
    'dashboard.events_description': {
      en: 'View your temple events',
      si: 'ඔබේ දේවස්ථාන සිදුවීම් බලන්න'
    },
    'dashboard.my_qr_code': {
      en: 'My QR Code',
      si: 'මගේ QR කේතය'
    },
    'dashboard.qr_description': {
      en: 'Generate and print your QR code',
      si: 'ඔබේ QR කේතය ජනනය කර මුද්‍රණය කරන්න'
    },
    'dashboard.qr_code_section': {
      en: 'QR Code',
      si: 'QR කේතය'
    },
    'dashboard.print_id_card': {
      en: 'Print ID Card',
      si: 'හැඳුනුම්පත මුද්‍රණය කරන්න'
    },
    'dashboard.quick_access': {
      en: 'Quick Access',
      si: 'වේගවත් ප්‍රවේශය'
    },
    'dashboard.qr_help': {
      en: 'Use your QR code for quick temple check-ins',
      si: 'වේගවත් දේවස්ථාන පිවිසීම් සඳහා ඔබේ QR කේතය භාවිතා කරන්න'
    },
    
    // Common
    'common.loading': {
      en: 'Loading...',
      si: 'පූරණය වෙමින්...'
    },
    'common.error': {
      en: 'Error',
      si: 'දෝෂය'
    },
    'common.success': {
      en: 'Success',
      si: 'සාර්ථකයි'
    },
    'common.cancel': {
      en: 'Cancel',
      si: 'අවලංගු කරන්න'
    },
    'common.save': {
      en: 'Save',
      si: 'සුරකින්න'
    },
    'common.edit': {
      en: 'Edit',
      si: 'සංස්කරණය'
    },
    'common.delete': {
      en: 'Delete',
      si: 'මකන්න'
    },
    'common.close': {
      en: 'Close',
      si: 'වසන්න'
    },
    'common.yes': {
      en: 'Yes',
      si: 'ඔව්'
    },
    'common.no': {
      en: 'No',
      si: 'නැහැ'
    },
    'common.ok': {
      en: 'OK',
      si: 'හරි'
    },
    'common.back': {
      en: 'Back',
      si: 'ආපසු'
    },
    'common.next': {
      en: 'Next',
      si: 'ඊළඟ'
    },
    'common.previous': {
      en: 'Previous',
      si: 'පෙර'
    },
    'common.finish': {
      en: 'Finish',
      si: 'අවසන්'
    },
    'common.continue': {
      en: 'Continue',
      si: 'ඉදිරියට'
    },
    'common.refresh': {
      en: 'Refresh',
      si: 'නැවුම්'
    },
    'common.search': {
      en: 'Search',
      si: 'සොයන්න'
    },
    'common.filter': {
      en: 'Filter',
      si: 'පෙරණය'
    },
    'common.sort': {
      en: 'Sort',
      si: 'වර්ග කරන්න'
    },
    'common.actions': {
      en: 'Actions',
      si: 'ක්‍රියා'
    },
    'common.status': {
      en: 'Status',
      si: 'තත්වය'
    },
    'common.role': {
      en: 'Role',
      si: 'භූමිකාව'
    },
    'common.created_at': {
      en: 'Created',
      si: 'සාදන ලද'
    },
    'common.updated_at': {
      en: 'Updated',
      si: 'යාවත්කාලීන'
    },
    'common.print': {
      en: 'Print',
      si: 'මුද්‍රණය'
    },
    
    // User Status
    'user.pending_approval': {
      en: 'Pending Approval',
      si: 'අනුමතිය අපේක්ෂාවෙන්'
    },
    'user.approved': {
      en: 'Approved',
      si: 'අනුමත'
    },
    'user.active': {
      en: 'Active',
      si: 'ක්‍රියාකාරී'
    },
    'user.limited_access': {
      en: 'Limited Access',
      si: 'සීමිත ප්‍රවේශය'
    },
    'user.devotee': {
      en: 'Devotee',
      si: 'භක්තිකයා'
    },
    'user.committee_member': {
      en: 'Committee Member',
      si: 'කමිටු සාමාජික'
    },
    'user.admin': {
      en: 'Admin',
      si: 'පරිපාලක'
    },
    
    // Sign Out
    'auth.sign_out': {
      en: 'Sign Out',
      si: 'පිටව යන්න'
    },
    
    // Pending Approval Messages
    'approval.pending_title': {
      en: 'Account Pending Approval',
      si: 'ගිණුම අනුමතිය අපේක්ෂාවෙන්'
    },
    'approval.pending_message': {
      en: 'Your account is pending approval from an administrator. You have limited access until approved.',
      si: 'ඔබේ ගිණුම පරිපාලකයෙකුගේ අනුමතිය අපේක්ෂාවෙන් පවතී. අනුමත වන තෙක් ඔබට සීමිත ප්‍රවේශයක් ඇත.'
    },
    'approval.welcome': {
      en: 'Welcome, {name}!',
      si: 'සාදරයෙන් පිළිගනිමු, {name}!'
    },
    'approval.review_message': {
      en: 'Your account is being reviewed. Here\'s what you can do while waiting for approval:',
      si: 'ඔබේ ගිණුම සමාලෝචනය කරමින් පවතී. අනුමතිය අපේක්ෂාවෙන් සිටියදී ඔබට කළ හැකි දේ මෙන්න:'
    },
    'approval.view_profile': {
      en: 'View Profile',
      si: 'පැතිකඩ බලන්න'
    },
    'approval.profile_description': {
      en: 'View and update your profile information.',
      si: 'ඔබේ පැතිකඩ තොරතුරු බලා යාවත්කාලීන කරන්න.'
    },
    'approval.status_description': {
      en: 'Check your approval status and account details.',
      si: 'ඔබේ අනුමතියේ තත්වය සහ ගිණුම් තොරතුරු පරීක්ෂා කරන්න.'
    },
    'approval.help_description': {
      en: 'Need assistance? Contact the temple administration.',
      si: 'උදව් අවශ්‍යද? දේවස්ථාන පරිපාලනය අමතන්න.'
    },
    'approval.refresh_status': {
      en: 'Refresh Status',
      si: 'තත්වය නැවුම්'
    },
    'approval.pending': {
      en: 'Pending',
      si: 'අපේක්ෂාවෙන්'
    },
    'approval.email': {
      en: 'Email',
      si: 'විද්‍යුත් තැපෑල'
    }
  };
  
  // Use the passed currentLanguage parameter
  
  const translationSet = translations[key];
  if (!translationSet) {
    return key; // Return key if translation not found
  }
  
  let translation = translationSet[currentLanguage] || translationSet['en'] || key;
  
  // Replace variables in translation
  if (variables) {
    Object.entries(variables).forEach(([varKey, varValue]) => {
      translation = translation.replace(`{${varKey}}`, varValue);
    });
  }
  
  return translation;
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = React.useState<Language>('si'); // Default to Sinhala
  
  // Load saved language preference
  React.useEffect(() => {
    const savedLanguage = localStorage.getItem('temple-language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'si')) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);
  
  const handleSetLanguage = (lang: Language) => {
    setCurrentLanguage(lang);
    localStorage.setItem('temple-language', lang);
  };

  const value: LanguageContextType = {
    language: currentLanguage,
    setLanguage: handleSetLanguage,
    t: (key: string, variables?: Record<string, string>) => t(key, variables, currentLanguage)
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
