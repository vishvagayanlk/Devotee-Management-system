import React, { createContext, useContext } from 'react';

export type Language = 'en' | 'si';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple translation function that just returns the key
const t = (key: string): string => {
  // For now, just return the key as fallback
  // This will show the translation keys instead of translated text
  return key;
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
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t
    };
  }
  return context;
}
