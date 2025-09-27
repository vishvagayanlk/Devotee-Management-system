import React from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar,
  Building2,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Heart,
  Globe
} from 'lucide-react';
import { useClerkAuth } from '../contexts/ClerkAuthContext';
import { UserButton } from '@clerk/clerk-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContextFallback';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { userProfile, signOut } = useClerkAuth();
  const isAdmin = userProfile?.role === 'admin';
  const isCommittee = userProfile?.role === 'committee';
  const { templeSettings } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const userNavItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: User, path: '/dashboard' },
    { id: 'records', label: t('nav.records'), icon: BookOpen, path: '/records' },
    { id: 'events', label: t('nav.events'), icon: Calendar, path: '/events' },
    { id: 'profile', label: t('nav.profile'), icon: Settings, path: '/profile' },
  ];

  const committeeNavItems = [
    { id: 'devotee-management', label: t('nav.devotee_management'), icon: Users, path: '/devotee-management' },
    { id: 'all-records', label: t('nav.all_records'), icon: BookOpen, path: '/all-records' },
    { id: 'all-events', label: t('nav.all_events'), icon: Building2, path: '/all-events' },
  ];

  const adminNavItems = [
    { id: 'admin', label: 'Admin Panel', icon: Users, path: '/admin' },
    { id: 'settings', label: t('nav.settings'), icon: Settings, path: '/settings' },
  ];

  // Show limited navigation for pending approval users
  const limitedNavItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: User, path: '/dashboard' },
    { id: 'profile', label: t('nav.profile'), icon: Settings, path: '/profile' },
  ];

  const navItems = !userProfile?.is_approved 
    ? limitedNavItems
    : isAdmin 
    ? [...userNavItems, ...committeeNavItems, ...adminNavItems]
    : isCommittee 
    ? [...userNavItems, ...committeeNavItems] 
    : userNavItems;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 bg-surface shadow-xl transform border-r border-theme ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:w-64`}
      >
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <div className="flex items-center space-x-2 min-w-0">
            <Heart className="w-8 h-8 text-primary flex-shrink-0" />
            <span className="text-lg sm:text-xl font-bold text-text truncate">
              {templeSettings?.temple_name || 'Temple Committee'}
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-muted hover:text-text hover:bg-border-light lg:hidden flex-shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-theme">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text truncate">{userProfile?.full_name}</p>
              <p className="text-xs text-muted capitalize truncate">
                {userProfile?.role === 'devotee' ? 'Devotee' : userProfile?.role === 'committee' ? 'Committee Member' : 'Admin'}
              </p>
              <div className="flex items-center mt-1">
                <div
                  className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${
                    userProfile?.is_approved ? 'bg-green-400' : 'bg-yellow-400'
                  }`}
                />
                <span className="text-xs text-muted capitalize truncate">
                  {userProfile?.is_approved ? 'Active' : 'Pending Approval'}
                </span>
              </div>
              {!userProfile?.is_approved && (
                <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                  Limited Access
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-primary-100 text-primary-700 border-r-2 border-primary shadow-sm'
                    : 'text-muted hover:bg-border-light hover:text-text'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-theme space-y-3">
          {/* User Profile Button */}
          <div className="w-full px-4 py-3">
            <UserButton 
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  userButtonBox: "w-full",
                  userButtonTrigger: "w-full justify-start",
                  userButtonPopoverCard: "w-64",
                }
              }}
            />
          </div>
          
          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="bg-surface shadow-sm border-b border-theme px-4 py-3 lg:px-6">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-muted hover:text-text hover:bg-border-light lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-lg sm:text-xl font-bold text-text lg:hidden truncate">
                {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h1>
              <div className="lg:hidden w-10"></div> {/* Spacer for centering */}
            </div>
            
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1">
                {/* Removed approval check - users can access all features */}
              </div>
              
              {/* Language Switcher */}
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-muted" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'si')}
                  className="text-sm bg-surface border border-theme rounded px-2 py-1 text-text focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="si">සිංහල</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}