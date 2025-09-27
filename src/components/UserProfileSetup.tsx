import React, { useState, useEffect } from 'react';
import { useClerkAuth } from '../contexts/ClerkAuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContextFallback';
import { useOnboardingProgress } from '../hooks/useOnboardingProgress';
import { supabase } from '../lib/supabase';
import { errorTracking } from '../lib/monitoring';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Users, 
  Save, 
  CheckCircle,
  AlertCircle,
  Building2,
  Heart
} from 'lucide-react';

interface UserProfileSetupProps {
  onComplete: () => void;
}

interface FormData {
  full_name: string;
  phone: string;
  nic: string;
  address: string;
  group_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
  occupation: string;
  special_requirements: string;
}

interface Group {
  id: string;
  name: string;
  description?: string;
}

export default function UserProfileSetup({ onComplete }: UserProfileSetupProps) {
  const { userProfile, updateUserProfile } = useClerkAuth();
  const { templeSettings } = useTheme();
  const { t } = useLanguage();
  const { updateProgress, getOverallProgress } = useOnboardingProgress();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState<FormData>({
    full_name: userProfile?.full_name || '',
    phone: userProfile?.phone || '',
    nic: userProfile?.nic || '',
    address: userProfile?.address || '',
    group_id: userProfile?.group_id || '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    date_of_birth: '',
    gender: 'male',
    occupation: '',
    special_requirements: '',
  });

  // Load groups on component mount
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, description')
        .order('name');

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      errorTracking.captureException(error as Error, { context: 'loadGroups' });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.full_name.trim()) {
        newErrors.full_name = 'Full name is required';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
      if (!formData.nic.trim()) {
        newErrors.nic = 'NIC number is required';
      } else if (!/^[0-9]{9}[vVxX]?$|^[0-9]{12}$/.test(formData.nic.replace(/\s/g, ''))) {
        newErrors.nic = 'Please enter a valid NIC number';
      }
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required';
      }
    }

    if (step === 2) {
      if (!formData.group_id) {
        newErrors.group_id = 'Please select a group';
      }
      if (!formData.date_of_birth) {
        newErrors.date_of_birth = 'Date of birth is required';
      }
      if (!formData.emergency_contact_name.trim()) {
        newErrors.emergency_contact_name = 'Emergency contact name is required';
      }
      if (!formData.emergency_contact_phone.trim()) {
        newErrors.emergency_contact_phone = 'Emergency contact phone is required';
      } else if (!/^[0-9+\-\s()]+$/.test(formData.emergency_contact_phone)) {
        newErrors.emergency_contact_phone = 'Please enter a valid phone number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setSaving(true);
    try {
      // Update basic profile information
      await updateUserProfile({
        full_name: formData.full_name,
        phone: formData.phone,
        nic: formData.nic,
        address: formData.address,
        group_id: formData.group_id,
      });

      // Store additional profile data (optional - don't block if it fails)
      try {
        const { error: profileError } = await supabase
          .from('user_profile_details')
          .upsert({
            user_id: userProfile?.id,
            emergency_contact_name: formData.emergency_contact_name,
            emergency_contact_phone: formData.emergency_contact_phone,
            date_of_birth: formData.date_of_birth,
            gender: formData.gender,
            occupation: formData.occupation,
            special_requirements: formData.special_requirements,
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.warn('Could not save additional profile details:', profileError);
          // Don't throw error - continue with basic profile completion
        } else {
          console.log('Additional profile details saved successfully');
        }
      } catch (error) {
        console.warn('Additional profile details save failed:', error);
        // Continue with basic profile completion
      }

      console.log('Profile setup completed successfully');
      errorTracking.captureMessage('User profile setup completed', 'info');
      
      // Update onboarding progress
      updateProgress('profile_basic_info', true);
      updateProgress('profile_contact_info', true);
      updateProgress('profile_address_info', true);
      updateProgress('profile_verification', true);
      updateProgress('profile_complete', true);
      
      // Set a flag to prevent onboarding loop
      localStorage.setItem('profile_setup_completed', 'true');
      localStorage.setItem('profile_setup_timestamp', Date.now().toString());
      
      // Force profile completion immediately
      console.log('Calling onComplete callback');
      onComplete();
      
    } catch (error) {
      console.error('Error saving profile:', error);
      errorTracking.captureException(error as Error, { context: 'handleSubmit' });
      setErrors({ submit: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Personal Information</h2>
        <p className="text-muted">Please provide your basic personal details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => handleInputChange('full_name', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.full_name ? 'border-red-500' : 'border-theme'
            }`}
            placeholder="Enter your full name"
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.full_name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.phone ? 'border-red-500' : 'border-theme'
              }`}
              placeholder="+94 77 123 4567"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            NIC Number *
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted" />
            <input
              type="text"
              value={formData.nic}
              onChange={(e) => handleInputChange('nic', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.nic ? 'border-red-500' : 'border-theme'
              }`}
              placeholder="123456789V or 1234567890123"
            />
          </div>
          {errors.nic && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.nic}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Date of Birth *
          </label>
          <input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.date_of_birth ? 'border-red-500' : 'border-theme'
            }`}
          />
          {errors.date_of_birth && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.date_of_birth}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Address *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted" />
          <textarea
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            rows={3}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.address ? 'border-red-500' : 'border-theme'
            }`}
            placeholder="Enter your complete address"
          />
        </div>
        {errors.address && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.address}
          </p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Temple Information</h2>
        <p className="text-muted">Select your group and provide additional details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-text mb-2">
            Temple Group *
          </label>
          <select
            value={formData.group_id}
            onChange={(e) => handleInputChange('group_id', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.group_id ? 'border-red-500' : 'border-theme'
            }`}
          >
            <option value="">Select a group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name} {group.description && `- ${group.description}`}
              </option>
            ))}
          </select>
          {errors.group_id && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.group_id}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Gender
          </label>
          <select
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className="w-full px-4 py-3 border border-theme rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Occupation
          </label>
          <input
            type="text"
            value={formData.occupation}
            onChange={(e) => handleInputChange('occupation', e.target.value)}
            className="w-full px-4 py-3 border border-theme rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Your occupation"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Emergency Contact Name *
          </label>
          <input
            type="text"
            value={formData.emergency_contact_name}
            onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
              errors.emergency_contact_name ? 'border-red-500' : 'border-theme'
            }`}
            placeholder="Emergency contact person"
          />
          {errors.emergency_contact_name && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.emergency_contact_name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Emergency Contact Phone *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted" />
            <input
              type="tel"
              value={formData.emergency_contact_phone}
              onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.emergency_contact_phone ? 'border-red-500' : 'border-theme'
              }`}
              placeholder="+94 77 123 4567"
            />
          </div>
          {errors.emergency_contact_phone && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.emergency_contact_phone}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
          <Heart className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-text mb-2">Additional Information</h2>
        <p className="text-muted">Any special requirements or additional details</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-text mb-2">
          Special Requirements
        </label>
        <textarea
          value={formData.special_requirements}
          onChange={(e) => handleInputChange('special_requirements', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-theme rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="Any special dietary requirements, accessibility needs, or other important information..."
        />
        <p className="mt-1 text-sm text-muted">
          This information will help us provide better service during temple events.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Profile Review</h3>
            <p className="text-sm text-blue-700 mt-1">
              Please review your information carefully. You can update these details later in your profile settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted">Loading profile setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundColor: templeSettings?.background_color || '#FEF7ED',
        fontFamily: templeSettings?.font_family || 'Inter, sans-serif'
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 bg-primary-100 rounded-full flex items-center justify-center mb-6">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">
            Welcome to {templeSettings?.temple_name || 'Temple Management System'}
          </h1>
          <p className="text-muted text-lg">
            Let's set up your profile to get started
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-text">Profile Setup Progress</span>
            <span className="text-sm text-muted">{getOverallProgress()}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${getOverallProgress()}%` }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Error Message */}
          {errors.submit && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            <div className="flex space-x-4">
              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Complete Setup
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
