# Fix Database Schema - Manual Steps

## Problem
The `temple_settings` and `themes` tables are missing the `is_active` column, causing errors in the ThemeContext.

## Solution
Run these SQL commands in your Supabase Dashboard > SQL Editor:

### 1. Add is_active column to temple_settings table
```sql
ALTER TABLE temple_settings 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

### 2. Add is_active column to themes table
```sql
ALTER TABLE themes 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

### 3. Update existing records to be active
```sql
UPDATE temple_settings SET is_active = true WHERE is_active IS NULL;
UPDATE themes SET is_active = true WHERE is_active IS NULL;
```

### 4. Add indexes for better performance
```sql
CREATE INDEX IF NOT EXISTS idx_temple_settings_is_active ON temple_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_themes_is_active ON themes(is_active);
```

### 5. Verify the changes
```sql
SELECT 'temple_settings' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'temple_settings' AND column_name = 'is_active'
UNION ALL
SELECT 'themes' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'themes' AND column_name = 'is_active';
```

## Alternative: Quick Fix
If you want to skip the database changes for now, the ThemeContext has been updated to handle missing columns gracefully. The app will work without the `is_active` columns, but you'll see some console errors.

## After Running the SQL
1. The database errors should disappear
2. The theme system will work properly
3. You can filter by `is_active = true` in the future
