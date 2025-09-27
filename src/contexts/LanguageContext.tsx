import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'si';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.records': 'My Records',
    'nav.events': 'Temple Events',
    'nav.profile': 'Profile',
    'nav.devotee_management': 'Devotee Management',
    'nav.all_records': 'All Records',
    'nav.all_events': 'All Events',
    'nav.settings': 'Temple Settings',
    'nav.sign_out': 'Sign Out',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.committee_title': 'Committee Dashboard',
    'dashboard.welcome': 'Welcome back, {name}. Here\'s your overview.',
    'dashboard.my_records': 'My Records',
    'dashboard.my_events': 'My Events',
    'dashboard.my_qr_code': 'My QR Code',
    'dashboard.qr_code_section': 'Your QR Code',
    'dashboard.qr_description': 'Print your personal ID card with QR code',
    'dashboard.print_id_card': 'Print ID Card',
    'dashboard.quick_access': 'Quick Access',
    'dashboard.qr_help': 'Scan this QR code to quickly access your profile and temple information',
    'dashboard.records_description': 'Temple records created',
    'dashboard.events_description': 'Created + Assigned events',
    
    // Devotee Management
    'devotee.title': 'Devotee Management',
    'devotee.search_placeholder': 'Search devotees...',
    'devotee.filter_all': 'All',
    'devotee.filter_pending': 'Pending',
    'devotee.filter_approved': 'Approved',
    'devotee.filter_rejected': 'Rejected',
    'devotee.role_devotee': 'Devotee',
    'devotee.role_committee': 'Committee',
    'devotee.role_admin': 'Admin',
    'devotee.approve': 'Approve',
    'devotee.reject': 'Reject',
    'devotee.edit': 'Edit Devotee',
    'devotee.generate_qr': 'Generate QR Code',
    'devotee.assign_group': 'Assign to Group',
    'devotee.view_activity': 'View Activity',
    'devotee.assign_event': 'Assign Event',
    'devotee.delete': 'Delete Devotee',
    'devotee.registered': 'Registered',
    'devotee.no_group': 'No Group',
    
    // Groups
    'group.manage': 'Manage Groups',
    'group.create': 'Create Group',
    'group.name': 'Group Name',
    'group.description': 'Description',
    'group.color': 'Color',
    'group.members': 'members',
    'group.assign_to': 'Assign to Group',
    'group.remove_from': 'Remove from current group',
    
    // Events
    'event.create': 'Create Event',
    'event.title': 'Event Title',
    'event.description': 'Description',
    'event.type': 'Event Type',
    'event.location': 'Location',
    'event.start_date': 'Start Date',
    'event.end_date': 'End Date',
    'event.all_day': 'All Day',
    'event.max_participants': 'Max Participants',
    'event.registration_required': 'Registration Required',
    'event.poya_day': 'Poya Day',
    'event.ceremony': 'Ceremony',
    'event.festival': 'Festival',
    'event.meeting': 'Meeting',
    'event.other': 'Other',
    
    // Profile
    'profile.title': 'Profile',
    'profile.personal_info': 'Personal Information',
    'profile.temple_info': 'Temple Information',
    'profile.full_name': 'Full Name',
    'profile.nic_number': 'NIC Number',
    'profile.address': 'Address',
    'profile.phone': 'Phone',
    'profile.email': 'Email',
    'profile.date_of_birth': 'Date of Birth',
    'profile.occupation': 'Occupation',
    'profile.emergency_contact': 'Emergency Contact',
    'profile.temple_join_date': 'Temple Join Date',
    'profile.bio': 'Bio',
    'profile.save': 'Save Changes',
    'profile.cancel': 'Cancel',
    
    // Records
    'record.title': 'Temple Records',
    'record.create': 'Create Record',
    'record.type': 'Record Type',
    'record.prayer': 'Prayer',
    'record.donation': 'Donation',
    'record.service': 'Service',
    'record.note': 'Note',
    'record.amount': 'Amount (LKR)',
    'record.date': 'Date',
    'record.content': 'Content',
    
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.close': 'Close',
    'common.print': 'Print',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.success': 'Success',
    'common.error': 'Error',
    'common.confirm': 'Are you sure?',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.role': 'Role',
    'common.created_at': 'Created At',
    'common.updated_at': 'Updated At',
  },
  si: {
    // Navigation
    'nav.dashboard': 'ප්‍රධාන පිටුව',
    'nav.records': 'මගේ වාර්තා',
    'nav.events': 'විහාර සිදුවීම්',
    'nav.profile': 'පැතිකඩ',
    'nav.devotee_management': 'භක්තිකයින් කළමනාකරණය',
    'nav.all_records': 'සියලුම වාර්තා',
    'nav.all_events': 'සියලුම සිදුවීම්',
    'nav.settings': 'විහාර සැකසුම්',
    'nav.sign_out': 'ඉවත් වන්න',
    
    // Dashboard
    'dashboard.title': 'ප්‍රධාන පිටුව',
    'dashboard.committee_title': 'කමිටු ප්‍රධාන පිටුව',
    'dashboard.welcome': 'ආයුබෝවන්, {name}. ඔබේ දෘෂ්ටිකෝණය මෙන්න.',
    'dashboard.my_records': 'මගේ වාර්තා',
    'dashboard.my_events': 'මගේ සිදුවීම්',
    'dashboard.my_qr_code': 'මගේ QR කේතය',
    'dashboard.qr_code_section': 'ඔබේ QR කේතය',
    'dashboard.qr_description': 'ඔබේ පුද්ගලික හැඳුනුම්පත් QR කේතය සමඟ මුද්‍රණය කරන්න',
    'dashboard.print_id_card': 'හැඳුනුම්පත මුද්‍රණය',
    'dashboard.quick_access': 'වේගවත් ප්‍රවේශය',
    'dashboard.qr_help': 'ඔබේ පැතිකඩ සහ විහාර තොරතුරු වේගවත් ප්‍රවේශය සඳහා මෙම QR කේතය ස්කෑන් කරන්න',
    'dashboard.records_description': 'විහාර වාර්තා සාදන ලද',
    'dashboard.events_description': 'සාදන ලද + පවරන ලද සිදුවීම්',
    
    // Devotee Management
    'devotee.title': 'භක්තිකයින් කළමනාකරණය',
    'devotee.search_placeholder': 'භක්තිකයින් සොයන්න...',
    'devotee.filter_all': 'සියල්ල',
    'devotee.filter_pending': 'පොරොත්තුවෙන්',
    'devotee.filter_approved': 'අනුමත',
    'devotee.filter_rejected': 'ප්‍රතික්ෂේප',
    'devotee.role_devotee': 'භක්තිකයා',
    'devotee.role_committee': 'කමිටුව',
    'devotee.role_admin': 'පරිපාලක',
    'devotee.approve': 'අනුමත කරන්න',
    'devotee.reject': 'ප්‍රතික්ෂේප කරන්න',
    'devotee.edit': 'භක්තිකයා සංස්කරණය',
    'devotee.generate_qr': 'QR කේතය ජනනය',
    'devotee.assign_group': 'කණ්ඩායමට පවරන්න',
    'devotee.view_activity': 'ක්‍රියාකාරකම් බලන්න',
    'devotee.assign_event': 'සිදුවීම පවරන්න',
    'devotee.delete': 'භක්තිකයා මකන්න',
    'devotee.registered': 'ලියාපදිංචි',
    'devotee.no_group': 'කණ්ඩායමක් නැත',
    
    // Groups
    'group.manage': 'කණ්ඩායම් කළමනාකරණය',
    'group.create': 'කණ්ඩායම සාදන්න',
    'group.name': 'කණ්ඩායමේ නම',
    'group.description': 'විස්තරය',
    'group.color': 'වර්ණය',
    'group.members': 'සාමාජිකයින්',
    'group.assign_to': 'කණ්ඩායමට පවරන්න',
    'group.remove_from': 'වත්මන් කණ්ඩායමෙන් ඉවත් කරන්න',
    
    // Events
    'event.create': 'සිදුවීම සාදන්න',
    'event.title': 'සිදුවීමේ මාතෘකාව',
    'event.description': 'විස්තරය',
    'event.type': 'සිදුවීමේ වර්ගය',
    'event.location': 'ස්ථානය',
    'event.start_date': 'ආරම්භක දිනය',
    'event.end_date': 'අවසන් දිනය',
    'event.all_day': 'සියලු දින',
    'event.max_participants': 'උපරිම සහභාගිකයින්',
    'event.registration_required': 'ලියාපදිංචිය අවශ්‍ය',
    'event.poya_day': 'පොය දිනය',
    'event.ceremony': 'උත්සවය',
    'event.festival': 'පෙරහැර',
    'event.meeting': 'සාකච්ඡාව',
    'event.other': 'වෙනත්',
    
    // Profile
    'profile.title': 'පැතිකඩ',
    'profile.personal_info': 'පුද්ගලික තොරතුරු',
    'profile.temple_info': 'විහාර තොරතුරු',
    'profile.full_name': 'සම්පූර්ණ නම',
    'profile.nic_number': 'ජාතික හැඳුනුම්පත් අංකය',
    'profile.address': 'ලිපිනය',
    'profile.phone': 'දුරකථන අංකය',
    'profile.email': 'විද්‍යුත් තැපෑල',
    'profile.date_of_birth': 'උපත් දිනය',
    'profile.occupation': 'රැකියාව',
    'profile.emergency_contact': 'හදිසි සම්බන්ධතාව',
    'profile.temple_join_date': 'විහාරයට එක්වූ දිනය',
    'profile.bio': 'ජීවිත කතාව',
    'profile.save': 'වෙනස්කම් සුරකින්න',
    'profile.cancel': 'අවලංගු කරන්න',
    
    // Records
    'record.title': 'විහාර වාර්තා',
    'record.create': 'වාර්තාව සාදන්න',
    'record.type': 'වාර්තා වර්ගය',
    'record.prayer': 'ප්‍රාර්ථනාව',
    'record.donation': 'දානය',
    'record.service': 'සේවාව',
    'record.note': 'සටහන',
    'record.amount': 'ප්‍රමාණය (රුපියල්)',
    'record.date': 'දිනය',
    'record.content': 'අන්තර්ගතය',
    
    // Common
    'common.loading': 'පූරණය වෙමින්...',
    'common.save': 'සුරකින්න',
    'common.cancel': 'අවලංගු කරන්න',
    'common.delete': 'මකන්න',
    'common.edit': 'සංස්කරණය',
    'common.close': 'වසන්න',
    'common.print': 'මුද්‍රණය',
    'common.yes': 'ඔව්',
    'common.no': 'නැහැ',
    'common.success': 'සාර්ථකයි',
    'common.error': 'දෝෂය',
    'common.confirm': 'ඔබට විශ්වාසද?',
    'common.search': 'සොයන්න',
    'common.filter': 'පෙරණය',
    'common.sort': 'වර්ග කරන්න',
    'common.actions': 'ක්‍රියා',
    'common.status': 'තත්වය',
    'common.role': 'භූමිකාව',
    'common.created_at': 'සාදන ලද දිනය',
    'common.updated_at': 'යාවත්කාලීන දිනය',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // Load language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('temple-language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'si')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage
  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('temple-language', lang);
    // Update HTML lang attribute
    document.documentElement.lang = lang;
  };

  // Update HTML lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // Translation function with variable substitution
  const t = (key: string, variables?: Record<string, string>): string => {
    let translation = translations[language][key as keyof typeof translations[typeof language]] || key;
    
    // Replace variables in translation
    if (variables) {
      Object.entries(variables).forEach(([varKey, varValue]) => {
        translation = translation.replace(`{${varKey}}`, varValue);
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
