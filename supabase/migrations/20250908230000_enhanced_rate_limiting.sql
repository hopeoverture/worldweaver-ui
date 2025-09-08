-- Migration: Enhanced Rate Limiting with Database Backend
-- This migration creates tables for scalable rate limiting

-- Create rate_limits table for tracking API usage
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL, -- Hashed combination of IP + endpoint for privacy
  bucket TEXT NOT NULL, -- Rate limit bucket (e.g., 'invites.create', 'admin.seed')
  count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index for efficient lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_key_bucket_window 
ON rate_limits(key_hash, bucket, window_start);

-- Create index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end 
ON rate_limits(window_end) WHERE window_end < NOW();

-- Enable RLS
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy for system-only access (rate limiting is system function)
CREATE POLICY rate_limits_system_only ON rate_limits
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to clean up expired rate limit records
CREATE OR REPLACE FUNCTION cleanup_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits WHERE window_end < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for atomic rate limit checking and incrementing
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key_hash TEXT,
  p_bucket TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSON AS $$
DECLARE
  current_window_start TIMESTAMPTZ;
  current_window_end TIMESTAMPTZ;
  current_count INTEGER;
  remaining INTEGER;
  reset_time TIMESTAMPTZ;
  result JSON;
BEGIN
  -- Calculate current window
  current_window_start := date_trunc('minute', NOW()) + 
    INTERVAL '1 minute' * FLOOR(EXTRACT(EPOCH FROM (NOW() - date_trunc('minute', NOW()))) / p_window_seconds);
  current_window_end := current_window_start + INTERVAL '1 second' * p_window_seconds;
  
  -- Try to get existing record for this window
  SELECT count, window_end INTO current_count, reset_time
  FROM rate_limits 
  WHERE key_hash = p_key_hash 
    AND bucket = p_bucket 
    AND window_start = current_window_start;
  
  IF NOT FOUND THEN
    -- No existing record, create new one
    INSERT INTO rate_limits (key_hash, bucket, count, window_start, window_end)
    VALUES (p_key_hash, p_bucket, 1, current_window_start, current_window_end);
    
    current_count := 1;
    reset_time := current_window_end;
  ELSE
    -- Check if limit exceeded
    IF current_count >= p_max_requests THEN
      remaining := 0;
    ELSE
      -- Increment counter
      UPDATE rate_limits 
      SET count = count + 1, updated_at = NOW()
      WHERE key_hash = p_key_hash 
        AND bucket = p_bucket 
        AND window_start = current_window_start;
      
      current_count := current_count + 1;
    END IF;
  END IF;
  
  remaining := GREATEST(0, p_max_requests - current_count);
  
  -- Build result
  result := json_build_object(
    'allowed', current_count <= p_max_requests,
    'count', current_count,
    'remaining', remaining,
    'reset_time', EXTRACT(EPOCH FROM reset_time)::INTEGER,
    'retry_after', CASE 
      WHEN current_count > p_max_requests 
      THEN EXTRACT(EPOCH FROM (reset_time - NOW()))::INTEGER 
      ELSE 0 
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create rate limit configuration table for dynamic configuration
CREATE TABLE IF NOT EXISTS rate_limit_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT UNIQUE NOT NULL,
  max_requests INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for configs
ALTER TABLE rate_limit_configs ENABLE ROW LEVEL SECURITY;

-- Create policy for system access to configs
CREATE POLICY rate_limit_configs_system_only ON rate_limit_configs
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Insert default rate limit configurations
INSERT INTO rate_limit_configs (bucket, max_requests, window_seconds, description) VALUES
  ('invites.create', 10, 60, 'Invite creation rate limit'),
  ('admin.seed', 2, 60, 'Admin seeding operations'),
  ('auth.login', 5, 300, 'Authentication attempts'),
  ('auth.register', 3, 300, 'Registration attempts'),
  ('api.general', 100, 60, 'General API rate limit'),
  ('upload.files', 20, 60, 'File upload rate limit'),
  ('worlds.create', 5, 300, 'World creation rate limit'),
  ('entities.create', 50, 60, 'Entity creation rate limit')
ON CONFLICT (bucket) DO NOTHING;

-- Create indexes for efficient configuration lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_configs_bucket_active 
ON rate_limit_configs(bucket) WHERE is_active = true;

-- Update function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_rate_limits_updated_at 
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rate_limit_configs_updated_at 
  BEFORE UPDATE ON rate_limit_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create cleanup job (to be called periodically)
CREATE OR REPLACE FUNCTION schedule_rate_limit_cleanup()
RETURNS VOID AS $$
BEGIN
  PERFORM cleanup_expired_rate_limits();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
