import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Users, BookOpen, Calendar, TrendingUp, UserCheck, Clock, Heart, Building2, QrCode, Download, Printer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import QRCodeGenerator from './QRCodeGenerator';

interface DashboardStats {
  totalRecords: number;
  totalEvents: number;
  totalDevotees?: number;
  pendingDevotees?: number;
  recentRecords?: any[];
  upcomingEvents?: any[];
}

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
  const { profile, isAdmin, isCommittee } = useAuth();
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
  const [stats, setStats] = useState<DashboardStats>({
    totalRecords: 0,
    totalEvents: 0,
    totalDevotees: 0,
    pendingDevotees: 0,
    recentRecords: [],
    upcomingEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [showQRGenerator, setShowQRGenerator] = useState(false);

  // Memoize callback functions to prevent unnecessary re-renders
  const handleShowQRGenerator = useCallback(() => setShowQRGenerator(true), []);
  const handleHideQRGenerator = useCallback(() => setShowQRGenerator(false), []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isCommittee) {
          const [recordsRes, eventsRes, devoteesRes, pendingRes, recentRecordsRes, upcomingEventsRes] = await Promise.all([
            supabase.from('devotee_records').select('id', { count: 'exact' }),
            supabase.from('temple_events').select('id', { count: 'exact' }),
            supabase.from('user_profiles').select('id', { count: 'exact' }),
            supabase.from('user_profiles').select('id', { count: 'exact' }).eq('status', 'pending'),
            supabase.from('devotee_records').select('title, created_at, user_id').order('created_at', { ascending: false }).limit(5),
            supabase.from('temple_events').select('title, start_date, user_id').gte('start_date', new Date().toISOString()).order('start_date', { ascending: true }).limit(5),
          ]);

          setStats({
            totalRecords: recordsRes.count || 0,
            totalEvents: eventsRes.count || 0,
            totalDevotees: devoteesRes.count || 0,
            pendingDevotees: pendingRes.count || 0,
            recentRecords: recentRecordsRes.data || [],
            upcomingEvents: upcomingEventsRes.data || [],
          });
        } else {
          // For regular users, get both created events and assigned events
          const [recordsRes, createdEventsRes, assignedEventsRes, recentRecordsRes, createdUpcomingRes] = await Promise.all([
            supabase.from('devotee_records').select('id', { count: 'exact' }).eq('user_id', profile?.id),
            supabase.from('temple_events').select('id', { count: 'exact' }).eq('user_id', profile?.id),
            supabase.from('event_assignments').select('event_id').eq('user_id', profile?.id),
            supabase.from('devotee_records').select('title, created_at').eq('user_id', profile?.id).order('created_at', { ascending: false }).limit(5),
            supabase.from('temple_events').select('title, start_date').eq('user_id', profile?.id).gte('start_date', new Date().toISOString()).order('start_date', { ascending: true }).limit(5),
          ]);

          // Get assigned event IDs
          const assignedEventIds = assignedEventsRes.data?.map(assignment => assignment.event_id) || [];
          
          // Fetch assigned events details
          let assignedEventsData: any[] = [];
          let assignedUpcomingData: any[] = [];
          if (assignedEventIds.length > 0) {
            const assignedEventsRes = await supabase
              .from('temple_events')
              .select('id, title, start_date')
              .in('id', assignedEventIds);
            
            if (assignedEventsRes.data) {
              assignedEventsData = assignedEventsRes.data;
              assignedUpcomingData = assignedEventsRes.data
                .filter(event => new Date(event.start_date) >= new Date())
                .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                .slice(0, 5);
            }
          }

          // Combine created and assigned events
          const totalEvents = (createdEventsRes.count || 0) + assignedEventsData.length;
          const allUpcomingEvents = [
            ...(createdUpcomingRes.data || []),
            ...assignedUpcomingData
          ].sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).slice(0, 5);

          setStats({
            totalRecords: recordsRes.count || 0,
            totalEvents: totalEvents,
            recentRecords: recentRecordsRes.data || [],
            upcomingEvents: allUpcomingEvents,
          });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.status === 'approved') {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [profile, isAdmin]);

  if (profile?.status !== 'approved') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-surface rounded-lg shadow-sm p-8 text-center border-theme">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-text mb-4">Welcome to Temple Committee</h2>
          <div className="max-w-md mx-auto">
            {profile?.status === 'pending' ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="font-medium text-yellow-800">Devotee Registration Pending</span>
                </div>
                <p className="text-yellow-700 text-sm">
                  Your devotee registration is being reviewed by the temple committee. You'll receive access once approved.
                </p>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center mb-2">
                  <UserCheck className="w-5 h-5 text-red-600 mr-2" />
                  <span className="font-medium text-red-800">Registration Not Approved</span>
                </div>
                <p className="text-red-700 text-sm">
                  Your devotee registration has been rejected. Please contact the temple committee for assistance.
                </p>
              </div>
            )}
            <p className="text-gray-600">
              Thank you for registering with our temple. We'll notify you once your devotee status changes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Memoize cards to prevent unnecessary re-computation
  const userCards = useMemo(() => [
    {
      title: t('dashboard.my_records'),
      value: stats.totalRecords,
      icon: BookOpen,
      color: 'bg-primary',
      bgColor: 'bg-primary-50',
      textColor: 'text-primary-700',
      description: t('dashboard.records_description'),
    },
    {
      title: t('dashboard.my_events'),
      value: stats.totalEvents,
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
  ], [t, stats.totalRecords, stats.totalEvents, handleShowQRGenerator]);

  const committeeCards = useMemo(() => [
    {
      title: 'Total Devotees',
      value: stats.totalDevotees,
      icon: Users,
      color: 'bg-secondary',
      bgColor: 'bg-secondary-50',
      textColor: 'text-secondary-700',
      description: 'Registered devotees',
    },
    {
      title: 'Pending Approval',
      value: stats.pendingDevotees,
      icon: TrendingUp,
      color: 'bg-accent',
      bgColor: 'bg-accent-50',
      textColor: 'text-accent-700',
      description: 'Awaiting review',
    },
  ], [stats.totalDevotees, stats.pendingDevotees]);

  const cards = useMemo(() => 
    isCommittee ? [...userCards, ...committeeCards] : userCards,
    [isCommittee, userCards, committeeCards]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-text">
            {isCommittee ? t('dashboard.committee_title') : t('dashboard.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted mt-1">
            {t('dashboard.welcome')} {profile?.full_name || ''}
          </p>
        </div>
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
            {stats.recentRecords && stats.recentRecords.length > 0 ? (
              <div className="space-y-3">
                {stats.recentRecords.map((record, index) => (
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
            {stats.upcomingEvents && stats.upcomingEvents.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingEvents.map((event, index) => (
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
                    {stats.pendingDevotees && stats.pendingDevotees > 0 && (
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
                      {stats.totalRecords} total
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
                      {stats.totalEvents} total
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