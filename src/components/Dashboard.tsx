import React, { useState, useMemo, memo, useCallback } from 'react';
import { Users, BookOpen, Calendar, TrendingUp, UserCheck, Clock, Building2, QrCode, Download, Printer } from 'lucide-react';
import { useClerkAuth } from '../contexts/ClerkAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContextFallback';
import { useNavigate } from 'react-router-dom';
import { useCachedDashboardStats } from '../hooks/useCachedData';
import QRCodeGenerator from './QRCodeGenerator';

// DashboardStats interface is now defined in the useCachedData hook

// Memoized card component to prevent unnecessary re-renders
const DashboardCard = memo(({ card, index }: { card: any; index: number }) => {
  const Icon = card.icon;
  return (
    <div 
      key={index} 
      className={`bg-surface rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-all duration-200 border-theme ${
        card.onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      }`}
      onClick={card.onClick}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className={`p-2 sm:p-3 rounded-lg ${card.bgColor}`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${card.textColor}`} />
        </div>
        <div className="text-right">
          <p className="text-2xl sm:text-3xl font-bold text-text">{card.value}</p>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-text mb-1">{card.title}</p>
        <p className="text-xs text-muted leading-relaxed">{card.description}</p>
      </div>
    </div>
  );
});

DashboardCard.displayName = 'DashboardCard';

export default function Dashboard() {
  const { userProfile, forceCreateProfile } = useClerkAuth();
  const profile = userProfile;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';
  const isCommittee = profile?.role === 'admin' || profile?.role === 'committee' || profile?.role === 'super_admin';
  const { templeSettings } = useTheme();
  const { t } = useLanguage();
  
  // Debug temple settings - memoized to prevent unnecessary re-runs
  React.useEffect(() => {
    console.log('Dashboard - Temple settings:', templeSettings);
    if (templeSettings) {
      console.log('Dashboard - Background color:', templeSettings.background_color);
      console.log('Dashboard - Primary color:', templeSettings.primary_color);
      console.log('Dashboard - Text color:', templeSettings.text_color);
      
      // Check what CSS variables are actually set
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      console.log('CSS Variables:');
      console.log('--color-background:', computedStyle.getPropertyValue('--color-background'));
      console.log('--color-primary:', computedStyle.getPropertyValue('--color-primary'));
      console.log('--color-text:', computedStyle.getPropertyValue('--color-text'));
    }
  }, [templeSettings]);
  
  const navigate = useNavigate();
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  
  // Use cached dashboard stats
  const { data: stats, loading, error, refetch } = useCachedDashboardStats(
    profile?.id || '',
    isAdmin,
    isCommittee
  );

  // Memoize callback functions to prevent unnecessary re-renders
  const handleShowQRGenerator = useCallback(() => setShowQRGenerator(true), []);
  const handleHideQRGenerator = useCallback(() => setShowQRGenerator(false), []);

  // Stats are now handled by the cached hook

  // Removed approval check - users can access dashboard immediately

  // Memoize cards to prevent unnecessary re-computation
  const userCards = useMemo(() => [
    {
      title: t('dashboard.my_records'),
      value: stats?.totalRecords || 0,
      icon: BookOpen,
      color: 'bg-primary',
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-700',
      description: t('dashboard.records_description'),
    },
    {
      title: t('dashboard.my_events'),
      value: stats?.totalEvents || 0,
      icon: Calendar,
      color: 'bg-accent',
      bgColor: 'bg-accent-50',
      textColor: 'text-accent-700',
      description: t('dashboard.events_description'),
    },
    {
      title: t('dashboard.my_qr_code'),
      value: t('common.print'),
      icon: QrCode,
      color: 'bg-secondary',
      bgColor: 'bg-secondary-50',
      textColor: 'text-secondary-700',
      description: t('dashboard.qr_description'),
      onClick: handleShowQRGenerator,
    },
  ], [t, stats?.totalRecords, stats?.totalEvents, handleShowQRGenerator]);

  const committeeCards = useMemo(() => [
    {
      title: 'Total Devotees',
      value: stats?.totalDevotees || 0,
      icon: Users,
      color: 'bg-secondary',
      bgColor: 'bg-secondary-50',
      textColor: 'text-secondary-700',
      description: 'Registered devotees',
    },
    {
      title: 'Pending Approval',
      value: stats?.pendingDevotees || 0,
      icon: TrendingUp,
      color: 'bg-accent',
      bgColor: 'bg-accent-50',
      textColor: 'text-accent-700',
      description: 'Awaiting review',
    },
  ], [stats?.totalDevotees, stats?.pendingDevotees]);

  const adminCards = useMemo(() => [
    {
      title: 'Total Records',
      value: stats?.totalRecords || 0,
      icon: BookOpen,
      color: 'bg-primary',
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-700',
      description: 'All devotee records',
    },
    {
      title: 'Total Events',
      value: stats?.totalEvents || 0,
      icon: Calendar,
      color: 'bg-accent',
      bgColor: 'bg-accent-50',
      textColor: 'text-accent-700',
      description: 'All temple events',
    },
    {
      title: 'Total Devotees',
      value: stats?.totalDevotees || 0,
      icon: Users,
      color: 'bg-secondary',
      bgColor: 'bg-secondary-50',
      textColor: 'text-secondary-700',
      description: 'Registered devotees',
    },
    {
      title: 'Pending Approval',
      value: stats?.pendingDevotees || 0,
      icon: TrendingUp,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      description: 'Awaiting review',
    },
  ], [stats?.totalRecords, stats?.totalEvents, stats?.totalDevotees, stats?.pendingDevotees]);

  const cards = useMemo(() => {
    if (isAdmin) {
      return adminCards;
    } else if (isCommittee) {
      return [...userCards, ...committeeCards];
    } else {
      return userCards;
    }
  }, [isAdmin, isCommittee, userCards, committeeCards, adminCards]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">
            {isAdmin ? 'Admin Dashboard' : isCommittee ? t('dashboard.committee_title') : t('dashboard.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted mt-1">
            {t('dashboard.welcome')} {profile?.full_name || ''}
          </p>
        </div>
        
        {/* Debug Section - Only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-800">Debug: Profile Status</h3>
                <p className="text-sm text-blue-700">
                  Profile: {userProfile ? 'Loaded' : 'Missing'} | 
                  Role: {profile?.role || 'Unknown'} | 
                  Approved: {profile?.is_approved ? 'Yes' : 'No'}
                </p>
                {error && (
                  <p className="text-sm text-red-700 mt-1">
                    Error: {error.message}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => refetch()}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Refresh Data
                </button>
                <button
                  onClick={() => forceCreateProfile()}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Force Create Profile
                </button>
                <button
                  onClick={() => window.location.href = '/profile-debug'}
                  className="bg-gray-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                  Debug Page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending Approval Message - Only show for non-admin users */}
        {profile && !profile.is_approved && !isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Account Pending Approval
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Your account is currently pending approval from an administrator. You can browse the system, but some features may be limited until your account is approved.
                </p>
                <div className="mt-3">
                  <span className="text-xs text-yellow-600">
                    Contact an administrator if you need immediate access.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Simple Profile Completion Banner */}
        {profile && (!profile.full_name || !profile.phone || !profile.address) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <UserCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Complete Your Profile
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  Add your personal details to get the most out of the temple management system.
                </p>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      // Navigate to profile settings or show a simple form
                      alert('Profile completion feature coming soon! You can continue using the system.');
                    }}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Complete Profile
                  </button>
                  <button
                    onClick={() => {
                      // Dismiss the banner
                      const banner = document.querySelector('.bg-blue-50') as HTMLElement;
                      if (banner) banner.style.display = 'none';
                    }}
                    className="ml-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: cards.length }).map((_, i) => (
            <div key={i} className="bg-surface rounded-lg shadow-sm p-4 sm:p-6 animate-pulse border-theme">
              <div className="h-4 bg-border-light rounded w-1/2 mb-4"></div>
              <div className="h-6 sm:h-8 bg-border-light rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-border-light rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {cards.map((card, index) => (
            <DashboardCard key={index} card={card} index={index} />
          ))}
        </div>
      )}

      {/* QR Code Section for Users */}
      {!isCommittee && (
        <div className="bg-surface rounded-lg shadow-sm border-theme p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="p-2 sm:p-3 bg-secondary-50 rounded-lg flex-shrink-0">
                <QrCode className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-text">{t('dashboard.qr_code_section')}</h3>
                <p className="text-xs sm:text-sm text-muted">{t('dashboard.qr_description')}</p>
              </div>
            </div>
            <button
              onClick={handleShowQRGenerator}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-600 transition-colors text-sm sm:text-base"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{t('dashboard.print_id_card')}</span>
              <span className="sm:hidden">{t('common.print')}</span>
            </button>
          </div>
          <div className="bg-surface-secondary rounded-lg p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm text-muted mb-1">{t('dashboard.quick_access')}</p>
                <p className="text-sm sm:text-base text-text font-medium">{t('dashboard.qr_help')}</p>
              </div>
              <div className="flex gap-2 justify-end sm:justify-start">
                <button
                  onClick={handleShowQRGenerator}
                  className="p-2 text-secondary hover:bg-secondary-50 rounded-lg transition-colors"
                  title="View QR Code"
                >
                  <QrCode className="w-5 h-5" />
                </button>
                <button
                  onClick={handleShowQRGenerator}
                  className="p-2 text-muted hover:bg-border-light rounded-lg transition-colors"
                  title="Download QR Code"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Records */}
        <div className="bg-surface rounded-lg shadow-sm border-theme">
          <div className="p-6 border-b border-theme">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {isCommittee ? 'Recent Records' : 'My Recent Records'}
              </h3>
            </div>
          </div>
          <div className="p-6">
            {stats?.recentRecords && stats.recentRecords.length > 0 ? (
              <div className="space-y-3">
                {stats.recentRecords.map((record: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {record.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(record.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No records yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-surface rounded-lg shadow-sm border-theme">
          <div className="p-6 border-b border-theme">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {isCommittee ? 'Upcoming Events' : 'My Upcoming Events'}
              </h3>
            </div>
          </div>
          <div className="p-6">
            {stats?.upcomingEvents && stats.upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingEvents.map((event: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No upcoming events</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-surface rounded-lg shadow-sm border-theme">
          <div className="p-4 sm:p-6 border-b border-theme">
            <h3 className="text-lg font-semibold text-text">Committee Quick Actions</h3>
            <p className="text-sm text-muted mt-1">Manage devotees and temple activities</p>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={() => navigate('/devotee-management')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Review Devotees</h4>
                    <p className="text-sm text-gray-600">Approve pending devotee registrations</p>
                    {stats?.pendingDevotees && stats.pendingDevotees > 0 && (
                      <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        {stats.pendingDevotees} pending
                      </span>
                    )}
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/all-records')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-accent-100 rounded-lg group-hover:bg-accent-200 transition-colors">
                    <BookOpen className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Manage Records</h4>
                    <p className="text-sm text-gray-600">View and moderate devotee records</p>
                    <span className="inline-block mt-1 px-2 py-1 bg-accent-100 text-accent-800 text-xs rounded-full">
                      {stats?.totalRecords || 0} total
                    </span>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => navigate('/all-events')}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-secondary-100 rounded-lg group-hover:bg-secondary-200 transition-colors">
                    <Building2 className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Temple Events</h4>
                    <p className="text-sm text-gray-600">Monitor temple ceremonies and events</p>
                    <span className="inline-block mt-1 px-2 py-1 bg-secondary-100 text-secondary-800 text-xs rounded-full">
                      {stats?.totalEvents || 0} total
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Generator Modal */}
      {showQRGenerator && profile && (
        <QRCodeGenerator
          devoteeId={profile.id}
          devoteeName={profile.full_name}
          devoteeEmail={profile.email || ''}
          devoteeRole={profile.role}
          onClose={handleHideQRGenerator}
        />
      )}
      </div>
    </div>
  );
}