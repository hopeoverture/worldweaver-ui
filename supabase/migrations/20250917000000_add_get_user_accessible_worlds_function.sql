-- Add function to get user accessible worlds (both owned and member worlds)
CREATE OR REPLACE FUNCTION get_user_accessible_worlds(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  owner_id UUID,
  name TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ,
  is_archived BOOLEAN,
  is_public BOOLEAN,
  settings JSONB,
  invite_link_enabled BOOLEAN,
  invite_link_role TEXT,
  invite_link_expires TIMESTAMPTZ,
  invite_link_max_uses INTEGER,
  logline TEXT,
  genre_blend TEXT[],
  overall_tone TEXT,
  key_themes TEXT[],
  audience_rating TEXT,
  scope_scale TEXT,
  technology_level TEXT[],
  magic_level TEXT[],
  cosmology_model TEXT,
  climate_biomes TEXT[],
  calendar_timekeeping TEXT,
  societal_overview TEXT,
  conflict_drivers TEXT[],
  rules_constraints TEXT,
  aesthetic_direction TEXT,
  user_role TEXT,
  owner_name TEXT,
  is_shared BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    w.id,
    w.owner_id,
    w.name,
    w.description,
    w.updated_at,
    w.is_archived,
    w.is_public,
    w.settings,
    w.invite_link_enabled,
    w.invite_link_role,
    w.invite_link_expires,
    w.invite_link_max_uses,
    w.logline,
    w.genre_blend,
    w.overall_tone,
    w.key_themes,
    w.audience_rating,
    w.scope_scale,
    w.technology_level,
    w.magic_level,
    w.cosmology_model,
    w.climate_biomes,
    w.calendar_timekeeping,
    w.societal_overview,
    w.conflict_drivers,
    w.rules_constraints,
    w.aesthetic_direction,
    CASE
      WHEN w.owner_id = user_uuid THEN 'owner'::TEXT
      ELSE COALESCE(wm.role::TEXT, 'viewer'::TEXT)
    END as user_role,
    COALESCE(p.display_name, p.email, 'Unknown') as owner_name,
    (w.owner_id != user_uuid) as is_shared
  FROM worlds w
  LEFT JOIN world_members wm ON w.id = wm.world_id AND wm.user_id = user_uuid
  LEFT JOIN profiles p ON w.owner_id = p.id
  WHERE
    (w.owner_id = user_uuid OR wm.user_id = user_uuid)
    AND w.is_archived = false
  ORDER BY w.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;