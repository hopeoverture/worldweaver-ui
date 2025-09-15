-- AI Usage Tracking System
-- Comprehensive tracking for AI operations, tokens, costs, and user quotas

-- =====================================================
-- AI USAGE TRACKING TABLE
-- =====================================================

CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  world_id UUID REFERENCES public.worlds(id) ON DELETE SET NULL,
  operation_type VARCHAR(50) NOT NULL, -- 'template', 'entity_fields', 'world_fields', 'image'
  model VARCHAR(50) NOT NULL, -- 'gpt-4o-mini', 'dall-e-3'

  -- Token/Usage metrics
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  image_size VARCHAR(20), -- for DALL-E: '1024x1024', '1024x1792', '1792x1024'
  image_quality VARCHAR(20), -- 'standard', 'hd'

  -- Cost tracking
  estimated_cost DECIMAL(10, 6), -- in USD

  -- Request details
  status VARCHAR(20) NOT NULL DEFAULT 'success', -- 'success', 'failed', 'rate_limited'
  error_message TEXT,
  response_time_ms INTEGER,

  -- Metadata
  prompt_hash VARCHAR(64), -- SHA-256 hash of prompt for deduplication analysis
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- DAILY USAGE AGGREGATES
-- =====================================================

CREATE TABLE public.ai_usage_daily (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  operation_type VARCHAR(50) NOT NULL,

  request_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,

  total_input_tokens INTEGER DEFAULT 0,
  total_output_tokens INTEGER DEFAULT 0,
  total_images INTEGER DEFAULT 0,

  total_cost DECIMAL(10, 6) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  PRIMARY KEY (user_id, date, operation_type)
);

-- =====================================================
-- MONTHLY USAGE AGGREGATES
-- =====================================================

CREATE TABLE public.ai_usage_monthly (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,

  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_images INTEGER DEFAULT 0,
  total_cost DECIMAL(10, 6) DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  PRIMARY KEY (user_id, year, month)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- AI usage indexes
CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_world_id ON ai_usage(world_id);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at DESC);
CREATE INDEX idx_ai_usage_operation_type ON ai_usage(operation_type);
CREATE INDEX idx_ai_usage_status ON ai_usage(status);
CREATE INDEX idx_ai_usage_model ON ai_usage(model);

-- Daily aggregates indexes
CREATE INDEX idx_ai_usage_daily_user_date ON ai_usage_daily(user_id, date DESC);
CREATE INDEX idx_ai_usage_daily_date ON ai_usage_daily(date DESC);

-- Monthly aggregates indexes
CREATE INDEX idx_ai_usage_monthly_user_month ON ai_usage_monthly(user_id, year DESC, month DESC);
CREATE INDEX idx_ai_usage_monthly_month ON ai_usage_monthly(year DESC, month DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_monthly ENABLE ROW LEVEL SECURITY;

-- AI usage policies
CREATE POLICY "Users can view own AI usage" ON ai_usage
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert AI usage" ON ai_usage
FOR INSERT WITH CHECK (true);

-- Daily aggregates policies
CREATE POLICY "Users can view own daily AI usage" ON ai_usage_daily
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage daily AI usage" ON ai_usage_daily
FOR ALL WITH CHECK (true);

-- Monthly aggregates policies
CREATE POLICY "Users can view own monthly AI usage" ON ai_usage_monthly
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage monthly AI usage" ON ai_usage_monthly
FOR ALL WITH CHECK (true);

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to aggregate daily usage
CREATE OR REPLACE FUNCTION update_ai_usage_daily_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ai_usage_daily (
    user_id, date, operation_type,
    request_count, success_count, failure_count,
    total_input_tokens, total_output_tokens, total_images, total_cost
  )
  VALUES (
    NEW.user_id,
    DATE(NEW.created_at),
    NEW.operation_type,
    1,
    CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
    COALESCE(NEW.input_tokens, 0),
    COALESCE(NEW.output_tokens, 0),
    CASE WHEN NEW.operation_type = 'image' AND NEW.status = 'success' THEN 1 ELSE 0 END,
    COALESCE(NEW.estimated_cost, 0)
  )
  ON CONFLICT (user_id, date, operation_type)
  DO UPDATE SET
    request_count = ai_usage_daily.request_count + 1,
    success_count = ai_usage_daily.success_count +
      CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
    failure_count = ai_usage_daily.failure_count +
      CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
    total_input_tokens = ai_usage_daily.total_input_tokens + COALESCE(NEW.input_tokens, 0),
    total_output_tokens = ai_usage_daily.total_output_tokens + COALESCE(NEW.output_tokens, 0),
    total_images = ai_usage_daily.total_images +
      CASE WHEN NEW.operation_type = 'image' AND NEW.status = 'success' THEN 1 ELSE 0 END,
    total_cost = ai_usage_daily.total_cost + COALESCE(NEW.estimated_cost, 0),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate monthly usage
CREATE OR REPLACE FUNCTION update_ai_usage_monthly_aggregates()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ai_usage_monthly (
    user_id, year, month,
    total_requests, total_tokens, total_images, total_cost
  )
  VALUES (
    NEW.user_id,
    EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
    EXTRACT(MONTH FROM NEW.created_at)::INTEGER,
    1,
    COALESCE(NEW.total_tokens, 0),
    CASE WHEN NEW.operation_type = 'image' AND NEW.status = 'success' THEN 1 ELSE 0 END,
    COALESCE(NEW.estimated_cost, 0)
  )
  ON CONFLICT (user_id, year, month)
  DO UPDATE SET
    total_requests = ai_usage_monthly.total_requests + 1,
    total_tokens = ai_usage_monthly.total_tokens + COALESCE(NEW.total_tokens, 0),
    total_images = ai_usage_monthly.total_images +
      CASE WHEN NEW.operation_type = 'image' AND NEW.status = 'success' THEN 1 ELSE 0 END,
    total_cost = ai_usage_monthly.total_cost + COALESCE(NEW.estimated_cost, 0),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update daily aggregates
CREATE TRIGGER trigger_update_ai_usage_daily
  AFTER INSERT ON ai_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_usage_daily_aggregates();

-- Trigger to update monthly aggregates
CREATE TRIGGER trigger_update_ai_usage_monthly
  AFTER INSERT ON ai_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_usage_monthly_aggregates();

-- =====================================================
-- QUOTA SYSTEM (Add to profiles table)
-- =====================================================

-- Add AI quota fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS
  ai_quota_tokens_monthly INTEGER DEFAULT 100000,
  ai_quota_images_monthly INTEGER DEFAULT 50,
  ai_quota_reset_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- Function to check AI quota
CREATE OR REPLACE FUNCTION check_ai_quota(
  p_user_id UUID,
  p_operation_type TEXT,
  p_tokens INTEGER DEFAULT 0
) RETURNS BOOLEAN AS $$
DECLARE
  quota_tokens INTEGER;
  quota_images INTEGER;
  used_tokens INTEGER;
  used_images INTEGER;
  reset_date DATE;
BEGIN
  -- Get user's quota limits
  SELECT ai_quota_tokens_monthly, ai_quota_images_monthly, ai_quota_reset_date
  INTO quota_tokens, quota_images, reset_date
  FROM profiles
  WHERE id = p_user_id;

  -- If no quota set, allow unlimited (for backwards compatibility)
  IF quota_tokens IS NULL OR quota_images IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Reset quota if past reset date
  IF reset_date <= CURRENT_DATE THEN
    UPDATE profiles
    SET ai_quota_reset_date = DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
    WHERE id = p_user_id;
    RETURN TRUE;
  END IF;

  -- Get current month usage
  SELECT
    COALESCE(SUM(total_tokens), 0),
    COALESCE(SUM(total_images), 0)
  INTO used_tokens, used_images
  FROM ai_usage_monthly
  WHERE user_id = p_user_id
    AND year = EXTRACT(YEAR FROM CURRENT_DATE)
    AND month = EXTRACT(MONTH FROM CURRENT_DATE);

  -- Check quotas
  IF p_operation_type = 'image' THEN
    RETURN used_images < quota_images;
  ELSE
    RETURN (used_tokens + p_tokens) <= quota_tokens;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE ai_usage IS 'Tracks individual AI operations including tokens, costs, and performance metrics';
COMMENT ON TABLE ai_usage_daily IS 'Daily aggregates of AI usage for efficient reporting and billing';
COMMENT ON TABLE ai_usage_monthly IS 'Monthly aggregates of AI usage for quota management and analytics';

COMMENT ON COLUMN ai_usage.operation_type IS 'Type of AI operation: template, entity_fields, world_fields, image';
COMMENT ON COLUMN ai_usage.model IS 'AI model used: gpt-4o-mini, dall-e-3';
COMMENT ON COLUMN ai_usage.estimated_cost IS 'Estimated cost in USD based on OpenAI pricing';
COMMENT ON COLUMN ai_usage.prompt_hash IS 'SHA-256 hash of the prompt for deduplication analysis';
COMMENT ON COLUMN ai_usage.metadata IS 'Additional operation-specific data';

COMMENT ON FUNCTION check_ai_quota IS 'Check if user has remaining AI quota for the current month';