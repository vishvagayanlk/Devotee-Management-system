-- Create temple_settings table for branding and configuration
CREATE TABLE temple_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  temple_name VARCHAR(255) NOT NULL DEFAULT 'Temple Devotee Committee',
  temple_description TEXT,
  temple_logo_url TEXT,
  temple_address TEXT,
  temple_phone VARCHAR(50),
  temple_email VARCHAR(255),
  temple_website VARCHAR(255),
  primary_color VARCHAR(7) DEFAULT '#F97316', -- Orange
  secondary_color VARCHAR(7) DEFAULT '#DC2626', -- Red
  accent_color VARCHAR(7) DEFAULT '#3B82F6', -- Blue
  background_color VARCHAR(7) DEFAULT '#FEF7ED', -- Light orange
  text_color VARCHAR(7) DEFAULT '#1F2937', -- Dark gray
  font_family VARCHAR(100) DEFAULT 'Inter',
  theme_name VARCHAR(50) DEFAULT 'default',
  custom_css TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create themes table for pre-built themes
CREATE TABLE themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  primary_color VARCHAR(7) NOT NULL,
  secondary_color VARCHAR(7) NOT NULL,
  accent_color VARCHAR(7) NOT NULL,
  background_color VARCHAR(7) NOT NULL,
  text_color VARCHAR(7) NOT NULL,
  font_family VARCHAR(100) DEFAULT 'Inter',
  preview_image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default themes
INSERT INTO themes (name, display_name, description, primary_color, secondary_color, accent_color, background_color, text_color, font_family) VALUES
('default', 'Classic Orange', 'Traditional temple theme with warm orange and red colors', '#F97316', '#DC2626', '#3B82F6', '#FEF7ED', '#1F2937', 'Inter'),
('buddhist', 'Buddhist Gold', 'Elegant gold and deep red theme inspired by Buddhist temples', '#D97706', '#B91C1C', '#059669', '#FFFBEB', '#1F2937', 'Inter'),
('modern', 'Modern Blue', 'Clean and modern blue theme for contemporary temples', '#2563EB', '#1D4ED8', '#7C3AED', '#F8FAFC', '#0F172A', 'Inter'),
('earth', 'Earth Tones', 'Natural earth tones perfect for meditation and mindfulness', '#A78BFA', '#059669', '#F59E0B', '#F0FDF4', '#1F2937', 'Inter'),
('minimal', 'Minimalist', 'Clean and minimal design with subtle colors', '#6B7280', '#374151', '#3B82F6', '#FFFFFF', '#111827', 'Inter'),
('vibrant', 'Vibrant Colors', 'Bright and energetic colors for festive occasions', '#EC4899', '#F59E0B', '#10B981', '#FDF2F8', '#1F2937', 'Inter');

-- Create RLS policies for temple_settings
ALTER TABLE temple_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage temple settings
CREATE POLICY "Only admins can manage temple settings" ON temple_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Everyone can read temple settings
CREATE POLICY "Everyone can read temple settings" ON temple_settings
FOR SELECT USING (is_active = true);

-- Create RLS policies for themes
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

-- Everyone can read active themes
CREATE POLICY "Everyone can read active themes" ON themes
FOR SELECT USING (is_active = true);

-- Only admins can manage themes
CREATE POLICY "Only admins can manage themes" ON themes
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Create function to get current temple settings
CREATE OR REPLACE FUNCTION get_current_temple_settings()
RETURNS temple_settings
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM temple_settings 
  WHERE is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1;
$$;

-- Create function to get all active themes
CREATE OR REPLACE FUNCTION get_active_themes()
RETURNS TABLE (
  id UUID,
  name VARCHAR(100),
  display_name VARCHAR(100),
  description TEXT,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  background_color VARCHAR(7),
  text_color VARCHAR(7),
  font_family VARCHAR(100),
  preview_image_url TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, name, display_name, description, primary_color, secondary_color, 
         accent_color, background_color, text_color, font_family, preview_image_url
  FROM themes 
  WHERE is_active = true 
  ORDER BY display_name;
$$;

-- Insert default temple settings
INSERT INTO temple_settings (temple_name, temple_description, temple_address, created_by) 
VALUES (
  'Temple Devotee Committee',
  'A modern temple management system for devotees and committee members',
  '123 Temple Street, City, Country',
  (SELECT id FROM auth.users LIMIT 1)
);
