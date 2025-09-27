-- Add recurring event fields to temple_events table
ALTER TABLE temple_events 
ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN recurrence_type VARCHAR(20) DEFAULT NULL, -- 'monthly', 'weekly', 'yearly'
ADD COLUMN recurrence_interval INTEGER DEFAULT 1, -- every 1 month, 2 weeks, etc.
ADD COLUMN recurrence_end_date DATE DEFAULT NULL, -- when to stop recurring
ADD COLUMN parent_event_id UUID DEFAULT NULL, -- reference to the original recurring event
ADD COLUMN recurrence_rule JSONB DEFAULT NULL; -- flexible recurrence rules

-- Add foreign key constraint for parent_event_id
ALTER TABLE temple_events 
ADD CONSTRAINT fk_parent_event 
FOREIGN KEY (parent_event_id) REFERENCES temple_events(id) ON DELETE CASCADE;

-- Add index for better performance on recurring event queries
CREATE INDEX idx_temple_events_recurring ON temple_events(is_recurring, parent_event_id);
CREATE INDEX idx_temple_events_recurrence_type ON temple_events(recurrence_type, start_date);

-- Add RLS policy for recurring events
CREATE POLICY "Users can view recurring events assigned to them" ON temple_events
FOR SELECT USING (
  is_recurring = true AND (
    id IN (
      SELECT ea.event_id 
      FROM event_assignments ea 
      WHERE ea.user_id = auth.uid()
    ) OR
    id IN (
      SELECT gea.event_id 
      FROM group_event_assignments gea
      JOIN user_profiles up ON up.group_id = gea.group_id
      WHERE up.id = auth.uid()
    )
  )
);

-- Update existing RLS policy to include recurring events
DROP POLICY IF EXISTS "Users can view their own events" ON temple_events;
CREATE POLICY "Users can view their own events and assigned recurring events" ON temple_events
FOR SELECT USING (
  user_id = auth.uid() OR
  id IN (
    SELECT ea.event_id 
    FROM event_assignments ea 
    WHERE ea.user_id = auth.uid()
  ) OR
  id IN (
    SELECT gea.event_id 
    FROM group_event_assignments gea
    JOIN user_profiles up ON up.group_id = gea.group_id
    WHERE up.id = auth.uid()
  )
);
