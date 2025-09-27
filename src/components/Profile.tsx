import React, { useState, useEffect } from 'react';
import { Save, User, Phone, FileText, Activity, Clock, MapPin, CreditCard, Mail, Calendar, Briefcase, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Database } from '../lib/supabase';

type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];

export default function Profile() {
  const { profile, refreshProfile, loading } = useAuth();
  
  console.log('Profile component - loading:', loading);
  console.log('Profile component - profile:', profile);
  const [formData, setFormData] = useState({
    full_name: '',
    nic_number: '',
    address: '',
    phone: '',
    email: '',
    date_of_birth: '',
    occupation: '',
    emergency_contact: '',
    temple_join_date: '',
    bio: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [showActivity, setShowActivity] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        nic_number: profile.nic_number || '',
        address: profile.address || '',
        phone: profile.phone || '',
        email: profile.email || '',
        date_of_birth: profile.date_of_birth || '',
        occupation: profile.occupation || '',
        emergency_contact: profile.emergency_contact || '',
        temple_join_date: profile.temple_join_date || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const fetchActivityLogs = async () => {
    if (!profile) return;
    
    setLoadingActivity(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setActivityLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleShowActivity = () => {
    setShowActivity(!showActivity);
    if (!showActivity && activityLogs.length === 0) {
      fetchActivityLogs();
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    // Validate required fields
    if (!formData.full_name?.trim()) {
      setMessage({ type: 'error', text: 'Full name is required' });
      return;
    }

    // Sanitize inputs
    const sanitizedData = {
      full_name: formData.full_name.trim(),
      nic_number: formData.nic_number?.trim().toUpperCase() || null,
      address: formData.address?.trim() || null,
      phone: formData.phone?.trim() || null,
      email: formData.email?.trim().toLowerCase() || null,
      date_of_birth: formData.date_of_birth || null,
      occupation: formData.occupation?.trim() || null,
      emergency_contact: formData.emergency_contact?.trim() || null,
      temple_join_date: formData.temple_join_date || null,
      bio: formData.bio?.trim() || null,
    };

    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(sanitizedData)
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-xl font-semibold text-red-800 mb-2">Profile Not Found</h1>
          <p className="text-red-600 mb-4">
            Your profile could not be loaded. This might be because:
          </p>
          <ul className="list-disc list-inside text-red-600 space-y-1 mb-4">
            <li>Your account is still being set up</li>
            <li>There was an error creating your profile</li>
            <li>You need to refresh the page</li>
          </ul>
          <button
            onClick={refreshProfile}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Devotee Profile</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Manage your personal information and temple membership details
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600" />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{profile?.full_name}</h2>
            <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 mt-1">
              <span className="text-xs sm:text-sm text-gray-500 capitalize">
                {profile?.role === 'devotee' ? 'Temple Devotee' : profile?.role === 'committee' ? 'Committee Member' : 'Administrator'}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                  profile?.status || ''
                )}`}
              >
                {profile?.status}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Temple member since {new Date(profile?.created_at || '').toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Full Name</span>
                </div>
              </label>
              <input
                type="text"
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="nic_number" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4" />
                  <span>NIC Number</span>
                </div>
              </label>
              <input
                type="text"
                id="nic_number"
                value={formData.nic_number}
                onChange={(e) => setFormData({ ...formData, nic_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your NIC number"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Phone Number</span>
                </div>
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email Address</span>
                </div>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your email address"
              />
            </div>

            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Date of Birth</span>
                </div>
              </label>
              <input
                type="date"
                id="date_of_birth"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="occupation" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4" />
                  <span>Occupation</span>
                </div>
              </label>
              <input
                type="text"
                id="occupation"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your occupation"
              />
            </div>

            <div>
              <label htmlFor="emergency_contact" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Emergency Contact</span>
                </div>
              </label>
              <input
                type="tel"
                id="emergency_contact"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter emergency contact number"
              />
            </div>

            <div>
              <label htmlFor="temple_join_date" className="block text-sm font-medium text-gray-700 mb-2">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4" />
                  <span>Temple Join Date</span>
                </div>
              </label>
              <input
                type="date"
                id="temple_join_date"
                value={formData.temple_join_date}
                onChange={(e) => setFormData({ ...formData, temple_join_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Address</span>
              </div>
            </label>
            <textarea
              id="address"
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Enter your full address"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Additional Notes</span>
              </div>
            </label>
            <textarea
              id="bio"
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Any additional notes about your temple involvement (optional)"
            />
          </div>

          <div className="flex justify-center sm:justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 sm:px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors w-full sm:w-auto"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Temple Membership Status</h3>
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
            <span className="text-xs sm:text-sm text-gray-600">Member ID:</span>
            <span className="text-xs sm:text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
              {profile?.id.slice(0, 8)}...
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
            <span className="text-xs sm:text-sm text-gray-600">Member Type:</span>
            <span className="text-xs sm:text-sm font-medium text-gray-900 capitalize">
              {profile?.role === 'devotee' ? 'Temple Devotee' : profile?.role === 'committee' ? 'Committee Member' : 'Administrator'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
            <span className="text-xs sm:text-sm text-gray-600">Status:</span>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                profile?.status || ''
              )}`}
            >
              {profile?.status}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
            <span className="text-xs sm:text-sm text-gray-600">Profile Last Updated:</span>
            <span className="text-xs sm:text-sm text-gray-900">
              {new Date(profile?.updated_at || '').toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Activity Log</span>
          </h3>
          <button
            onClick={handleShowActivity}
            className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium px-2 py-1 rounded"
          >
            {showActivity ? 'Hide Activity' : 'Show Activity'}
          </button>
        </div>

        {showActivity && (
          <div className="space-y-3">
            {loadingActivity ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="text-center py-4">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No activity recorded yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-48 sm:max-h-64 overflow-y-auto">
                {activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-900 break-words">
                        {log.description || `${log.action} on ${log.table_name}`}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(log.created_at).toLocaleString()}
                        {log.admin_id && log.admin_id !== log.user_id && (
                          <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                            Admin Action
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}