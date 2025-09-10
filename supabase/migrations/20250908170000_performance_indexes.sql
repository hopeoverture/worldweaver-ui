-- Migration for Step 7: Database Performance & Indexing
-- Adds indexes for common query patterns and performance

-- Entities: index for world_id and updated_at DESC
CREATE INDEX CONCURRENTLY idx_entities_world_updated 
  ON entities(world_id, updated_at DESC);

-- Templates: index for name where is_system = true
CREATE INDEX CONCURRENTLY idx_templates_system_name 
  ON templates(name) WHERE is_system = true;

-- Add additional composite indexes for common filter combinations as needed
-- Example: Composite index for entities by world_id, template_id, and updated_at
CREATE INDEX CONCURRENTLY idx_entities_world_template_updated 
  ON entities(world_id, template_id, updated_at DESC);

-- Example: Composite index for templates by world_id, category, and name
CREATE INDEX CONCURRENTLY idx_templates_world_category_name 
  ON templates(world_id, category, name);

-- Document expected query performance SLAs in DATABASE_PERFORMANCE.md
-- (See checklist for details)
