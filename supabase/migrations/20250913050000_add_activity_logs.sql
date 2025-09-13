-- Create activity logs table for user activity tracking
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  resource_type VARCHAR(50), -- 'world', 'entity', 'template', 'folder', 'relationship', 'member'
  resource_id UUID,
  resource_name TEXT,
  world_id UUID REFERENCES worlds(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_world_id ON activity_logs(world_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON activity_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

-- RLS policies for activity logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own activity logs
CREATE POLICY "Users can view own activity logs" ON activity_logs
FOR SELECT USING (auth.uid() = user_id);

-- System can insert activity logs (for API endpoints)
CREATE POLICY "Service role can insert activity logs" ON activity_logs
FOR INSERT WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE activity_logs IS 'User activity tracking for profile activity feed';
COMMENT ON COLUMN activity_logs.action IS 'Action type: create_world, create_entity, update_template, etc.';
COMMENT ON COLUMN activity_logs.description IS 'Human-readable description of the action';
COMMENT ON COLUMN activity_logs.resource_type IS 'Type of resource affected';
COMMENT ON COLUMN activity_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN activity_logs.resource_name IS 'Name of the affected resource for display';
COMMENT ON COLUMN activity_logs.world_id IS 'World context for the activity';
COMMENT ON COLUMN activity_logs.metadata IS 'Additional data about the activity';