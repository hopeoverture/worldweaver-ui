# Database Performance & Indexing - Query Performance SLAs

## Expected Query Performance

- **Entities by world_id, updated_at DESC:**
  - SLA: Query returns < 50ms for 95th percentile (up to 1000 entities)
  - Index: `idx_entities_world_updated`

- **Templates by name (system templates):**
  - SLA: Query returns < 50ms for 95th percentile
  - Index: `idx_templates_system_name`

- **Entities by world_id, template_id, updated_at DESC:**
  - SLA: Query returns < 50ms for 95th percentile
  - Index: `idx_entities_world_template_updated`

- **Templates by world_id, category, name:**
  - SLA: Query returns < 50ms for 95th percentile
  - Index: `idx_templates_world_category_name`

## Performance Testing

- Test query performance with large datasets (1000+ entities/templates)
- Use EXPLAIN ANALYZE to validate index usage
- Monitor query times in production and adjust indexes as needed

## Documentation

- All indexes created in `supabase/migrations/20250908170000_performance_indexes.sql`
- Update this file with additional indexes and performance results as needed
