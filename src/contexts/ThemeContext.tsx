import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, Database } from '../lib/supabase';

type TempleSettings = Database['public']['Tables']['temple_settings']['Row'];
type Theme = Database['public']['Tables']['themes']['Row'];

interface ThemeContextType {
  templeSettings: TempleSettings | null;
  themes: Theme[];
  loading: boolean;
  updateTempleSettings: (settings: Partial<TempleSettings>) => Promise<void>;
  applyTheme: (theme: Theme) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [templeSettings, setTempleSettings] = useState<TempleSettings | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTempleSettings = async () => {
    try {
      console.log('Fetching temple settings...');
      const { data, error } = await supabase
        .from('temple_settings')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Temple settings fetch error:', error);
        throw error;
      }

      console.log('Temple settings loaded:', data);
      setTempleSettings(data);
      
      // If no temple settings exist, create default ones
      if (!data) {
        console.log('No temple settings found, creating default settings...');
        await createDefaultTempleSettings();
      }
    } catch (error) {
      console.error('Error fetching temple settings:', error);
    }
  };

  const createDefaultTempleSettings = async () => {
    try {
      console.log('Creating default temple settings...');
      const defaultSettings = {
        temple_name: 'Temple Devotee Committee',
        temple_description: 'Sri Lanka Temple Devotee Management System',
        primary_color: '#F97316',
        secondary_color: '#DC2626',
        accent_color: '#3B82F6',
        background_color: '#FEF7ED',
        text_color: '#1F2937',
        font_family: 'Inter',
        theme_name: 'default',
        is_active: true,
      };

      const { data, error } = await supabase
        .from('temple_settings')
        .insert([defaultSettings])
        .select()
        .single();

      if (error) {
        console.error('Error creating default temple settings:', error);
        return;
      }

      console.log('Default temple settings created:', data);
      setTempleSettings(data);
    } catch (error) {
      console.error('Error creating default temple settings:', error);
    }
  };

  const fetchThemes = async () => {
    try {
      const { data, error } = await supabase
        .from('themes')
        .select('*')
        .eq('is_active', true)
        .order('display_name', { ascending: true });

      if (error) throw error;
      setThemes(data || []);
    } catch (error) {
      console.error('Error fetching themes:', error);
    }
  };

  const refreshSettings = async () => {
    console.log('ThemeContext: Refreshing settings...');
    setLoading(true);
    await Promise.all([fetchTempleSettings(), fetchThemes()]);
    setLoading(false);
    console.log('ThemeContext: Settings refresh complete');
  };

  const updateTempleSettings = async (settings: Partial<TempleSettings>) => {
    try {
      if (templeSettings) {
        // Update existing settings
        const { data, error } = await supabase
          .from('temple_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', templeSettings.id)
          .select()
          .single();

        if (error) throw error;
        setTempleSettings(data);
      } else {
        // Create new settings
        const { data, error } = await supabase
          .from('temple_settings')
          .insert([settings])
          .select()
          .single();

        if (error) throw error;
        setTempleSettings(data);
      }

      // Apply the new settings to the DOM
      applySettingsToDOM(settings);
    } catch (error) {
      console.error('Error updating temple settings:', error);
      throw error;
    }
  };

  const applyTheme = async (theme: Theme) => {
    const themeSettings = {
      primary_color: theme.primary_color,
      secondary_color: theme.secondary_color,
      accent_color: theme.accent_color,
      background_color: theme.background_color,
      text_color: theme.text_color,
      font_family: theme.font_family,
      theme_name: theme.name,
    };

    await updateTempleSettings(themeSettings);
  };

  const applySettingsToDOM = (settings: Partial<TempleSettings>) => {
    console.log('Applying settings to DOM:', settings);
    const root = document.documentElement;
    
    // Apply main theme colors
    if (settings.primary_color) {
      root.style.setProperty('--color-primary', settings.primary_color);
      console.log('Set --color-primary to:', settings.primary_color);
    }
    if (settings.secondary_color) {
      root.style.setProperty('--color-secondary', settings.secondary_color);
      console.log('Set --color-secondary to:', settings.secondary_color);
    }
    if (settings.accent_color) {
      root.style.setProperty('--color-accent', settings.accent_color);
      console.log('Set --color-accent to:', settings.accent_color);
    }
    if (settings.background_color) {
      root.style.setProperty('--color-background', settings.background_color);
      console.log('Set --color-background to:', settings.background_color);
    }
    if (settings.text_color) {
      root.style.setProperty('--color-text', settings.text_color);
      console.log('Set --color-text to:', settings.text_color);
    }
    if (settings.font_family) {
      root.style.setProperty('--font-family', settings.font_family);
      console.log('Set --font-family to:', settings.font_family);
    }
    
    // Apply extended color palette
    if (settings.background_color) {
      // Create surface colors based on background
      const surfaceColor = settings.background_color === '#FEF7ED' ? '#FFFFFF' : '#F8FAFC';
      root.style.setProperty('--color-surface', surfaceColor);
      root.style.setProperty('--color-surface-secondary', settings.background_color);
      console.log('Set --color-surface to:', surfaceColor);
      console.log('Set --color-surface-secondary to:', settings.background_color);
    }
    
    // Force a re-render by adding a class to the body
    document.body.classList.add('theme-applied');
    setTimeout(() => {
      document.body.classList.remove('theme-applied');
    }, 100);
  };

  useEffect(() => {
    console.log('ThemeContext: Initializing theme...');
    refreshSettings();
  }, []);

  useEffect(() => {
    console.log('ThemeContext: templeSettings changed:', templeSettings);
    if (templeSettings) {
      console.log('ThemeContext: Applying settings to DOM...');
      applySettingsToDOM(templeSettings);
    } else {
      console.log('ThemeContext: No temple settings to apply');
    }
  }, [templeSettings]);

  const value: ThemeContextType = {
    templeSettings,
    themes,
    loading,
    updateTempleSettings,
    applyTheme,
    refreshSettings,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
