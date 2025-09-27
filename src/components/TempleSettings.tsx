import React, { useState, useEffect } from 'react';
import { Save, Palette, Building2, Upload, Eye, RefreshCw, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase, Database } from '../lib/supabase';

type TempleSettings = Database['public']['Tables']['temple_settings']['Row'];
type Theme = Database['public']['Tables']['themes']['Row'];

export default function TempleSettings() {
  const { profile, isAdmin } = useAuth();
  const { templeSettings, themes, updateTempleSettings, applyTheme, refreshSettings } = useTheme();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'branding' | 'theme' | 'preview'>('branding');
  const [previewMode, setPreviewMode] = useState(false);
  const [previewSettings, setPreviewSettings] = useState<Partial<TempleSettings>>({});

  const [formData, setFormData] = useState({
    temple_name: '',
    temple_description: '',
    temple_logo_url: '',
    temple_address: '',
    temple_phone: '',
    temple_email: '',
    temple_website: '',
    primary_color: '#F97316',
    secondary_color: '#DC2626',
    accent_color: '#3B82F6',
    background_color: '#FEF7ED',
    text_color: '#1F2937',
    font_family: 'Inter',
    theme_name: 'default',
    custom_css: '',
  });

  useEffect(() => {
    if (templeSettings) {
      setFormData({
        temple_name: templeSettings.temple_name || '',
        temple_description: templeSettings.temple_description || '',
        temple_logo_url: templeSettings.temple_logo_url || '',
        temple_address: templeSettings.temple_address || '',
        temple_phone: templeSettings.temple_phone || '',
        temple_email: templeSettings.temple_email || '',
        temple_website: templeSettings.temple_website || '',
        primary_color: templeSettings.primary_color || '#F97316',
        secondary_color: templeSettings.secondary_color || '#DC2626',
        accent_color: templeSettings.accent_color || '#3B82F6',
        background_color: templeSettings.background_color || '#FEF7ED',
        text_color: templeSettings.text_color || '#1F2937',
        font_family: templeSettings.font_family || 'Inter',
        theme_name: templeSettings.theme_name || 'default',
        custom_css: templeSettings.custom_css || '',
      });
    }
  }, [templeSettings]);

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">
            You need administrator privileges to access temple settings.
          </p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateTempleSettings(formData);
      setNotification({ type: 'success', message: 'Temple settings updated successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setNotification({ type: 'error', message: 'Failed to save settings. Please try again.' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeSelect = async (theme: Theme) => {
    try {
      setLoading(true);
      await applyTheme(theme);
      setFormData(prev => ({
        ...prev,
        primary_color: theme.primary_color,
        secondary_color: theme.secondary_color,
        accent_color: theme.accent_color,
        background_color: theme.background_color,
        text_color: theme.text_color,
        font_family: theme.font_family,
        theme_name: theme.name,
      }));
      setNotification({ type: 'success', message: `Applied ${theme.display_name} theme!` });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error applying theme:', error);
      setNotification({ type: 'error', message: 'Failed to apply theme. Please try again.' });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    setPreviewSettings(formData);
    setPreviewMode(true);
  };

  const handleCancelPreview = () => {
    setPreviewMode(false);
    setPreviewSettings({});
  };

  const applyPreviewToDOM = (settings: Partial<TempleSettings>) => {
    const root = document.documentElement;
    
    if (settings.primary_color) {
      root.style.setProperty('--color-primary', settings.primary_color);
    }
    if (settings.secondary_color) {
      root.style.setProperty('--color-secondary', settings.secondary_color);
    }
    if (settings.accent_color) {
      root.style.setProperty('--color-accent', settings.accent_color);
    }
    if (settings.background_color) {
      root.style.setProperty('--color-background', settings.background_color);
    }
    if (settings.text_color) {
      root.style.setProperty('--color-text', settings.text_color);
    }
    if (settings.font_family) {
      root.style.setProperty('--font-family', settings.font_family);
    }
  };

  useEffect(() => {
    if (previewMode && previewSettings) {
      applyPreviewToDOM(previewSettings);
    } else if (!previewMode && templeSettings) {
      applyPreviewToDOM(templeSettings);
    }
  }, [previewMode, previewSettings, templeSettings]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl max-w-sm transform transition-all duration-300 ease-in-out ${
          notification.type === 'success' 
            ? 'bg-green-50 border-l-4 border-green-400 text-green-800' 
            : 'bg-red-50 border-l-4 border-red-400 text-red-800'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <Check className="w-6 h-6 text-green-400" />
              ) : (
                <X className="w-6 h-6 text-red-400" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">
                {notification.type === 'success' ? 'Success!' : 'Error!'}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {notification.message}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setNotification(null)}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Temple Settings</h1>
          <p className="text-gray-600 mt-2">
            Customize your temple's branding, appearance, and system settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshSettings}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('branding')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'branding'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Branding
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'theme'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Palette className="w-4 h-4 inline mr-2" />
            Theme & Colors
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preview'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Preview
          </button>
        </nav>
      </div>

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Temple Branding</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temple Name *
                </label>
                <input
                  type="text"
                  value={formData.temple_name}
                  onChange={(e) => setFormData({ ...formData, temple_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter temple name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temple Description
                </label>
                <textarea
                  rows={3}
                  value={formData.temple_description}
                  onChange={(e) => setFormData({ ...formData, temple_description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Enter temple description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.temple_logo_url}
                  onChange={(e) => setFormData({ ...formData, temple_logo_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  rows={2}
                  value={formData.temple_address}
                  onChange={(e) => setFormData({ ...formData, temple_address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Enter temple address"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.temple_phone}
                  onChange={(e) => setFormData({ ...formData, temple_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.temple_email}
                  onChange={(e) => setFormData({ ...formData, temple_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="info@temple.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.temple_website}
                  onChange={(e) => setFormData({ ...formData, temple_website: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://temple.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom CSS
                </label>
                <textarea
                  rows={4}
                  value={formData.custom_css}
                  onChange={(e) => setFormData({ ...formData, custom_css: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                  placeholder="/* Custom CSS styles */"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme Tab */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          {/* Pre-built Themes */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pre-built Themes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.theme_name === theme.name
                      ? 'border-primary bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleThemeSelect(theme)}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: theme.primary_color }}
                    />
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: theme.secondary_color }}
                    />
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: theme.accent_color }}
                    />
                  </div>
                  <h4 className="font-medium text-gray-900">{theme.display_name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{theme.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Colors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.accent_color}
                    onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.background_color}
                    onChange={(e) => setFormData({ ...formData, background_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.text_color}
                    onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Family
                </label>
                <select
                  value={formData.font_family}
                  onChange={(e) => setFormData({ ...formData, font_family: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Lato">Lato</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Montserrat">Montserrat</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Live Preview</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreview}
                className="bg-accent hover:bg-accent-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Preview Changes</span>
              </button>
              {previewMode && (
                <button
                  onClick={handleCancelPreview}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel Preview</span>
                </button>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-primary mb-2">{formData.temple_name}</h2>
              <p className="text-gray-600">{formData.temple_description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-primary text-white p-4 rounded-lg text-center">
                <h3 className="font-semibold">Primary</h3>
                <p className="text-sm opacity-90">Main brand color</p>
              </div>
              <div className="bg-secondary text-white p-4 rounded-lg text-center">
                <h3 className="font-semibold">Secondary</h3>
                <p className="text-sm opacity-90">Accent color</p>
              </div>
              <div className="bg-accent text-white p-4 rounded-lg text-center">
                <h3 className="font-semibold">Accent</h3>
                <p className="text-sm opacity-90">Highlight color</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900 mb-2">Sample Card</h4>
                <p className="text-gray-600 mb-3">This is how content will look with your theme.</p>
                <button className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors">
                  Sample Button
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
