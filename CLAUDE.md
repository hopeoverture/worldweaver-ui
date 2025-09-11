# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- `npm run dev`: Start development server (includes Windows Node 22 readlink patch)
- `npm run build`: Build production version (includes readlink patch)
- `npm run start`: Start production server
- `npm run test`: Run tests with Vitest (minimal test suite currently)
- `npm run lint`: Run ESLint with flat config
- `npm run seed:core`: Seed core system templates (requires dev server running)
- `npm run test:api`: Run API endpoint tests
- `npm run test:mcp`: Test MCP server configuration and connectivity

### Database Operations
- Apply migrations: Use Supabase SQL editor, Supabase CLI (`npx supabase db push`), or direct psql
- Regenerate types: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/lib/supabase/types.generated.ts`

## Environment Setup

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations

Optional environment variables for development:
- `SEED_ADMIN_TOKEN`: Random secret for seeding endpoints
- `SEED_BASE_URL`: Base URL for seeding (default: http://localhost:3000)
- `ADMIN_SEED_ENABLED`: Enable seeding in production (default: false)

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.5.2 with App Router
- **UI**: React 19.1.0 with Tailwind CSS 4.1.x
- **Database**: Supabase with PostgreSQL
- **State Management**: Zustand for client state, TanStack Query for server state
- **Authentication**: Supabase Auth with SSR support
- **Testing**: Vitest
- **Type Safety**: TypeScript with strict mode, Zod for validation

### Project Structure
- `src/app/`: Next.js App Router pages and API routes
- `src/components/`: Reusable React components organized by domain
- `src/lib/`: Core utilities and services
  - `src/lib/supabase/`: Supabase client configurations (browser/server)
  - `src/lib/services/`: Domain service layers (e.g., SupabaseWorldService)
  - `src/lib/types.ts`: Core domain types
- `src/hooks/`: React hooks split by queries and mutations
- `src/providers/`: React context providers

### Core Domain Model
The application manages "worlds" containing entities, templates, folders, and relationships:
- **World**: Top-level container with members, settings, and content
- **Entity**: Individual items in a world with custom fields based on templates
- **Template**: Defines field schemas for entities (supports system-wide and world-specific)
- **Folder**: Organizes entities within a world
- **Relationship**: Links between entities with typed connections

### Data Layer Architecture
- **SupabaseWorldService**: Main service class handling all database operations (`src/lib/services/worldService.ts`)
- **Type-safe database operations**: Uses generated types from Supabase schema
- **Row Level Security (RLS)**: Enforced at database level for all tables with helper functions:
  - `user_has_world_access(world_id, user_id)`: Checks ownership, membership, or public access
  - `user_can_edit_world(world_id)`: Checks if user can edit (owner or editor/admin member)  
  - `user_is_world_admin(world_id)`: Checks if user is admin (owner or admin member)
  - `user_email_matches_invite(email)`: Checks if current user email matches invite
- **JSONB fields**: Flexible custom data storage (entities.data, folders.data, profiles.data, etc.)
- **Adapter Pattern**: `src/lib/adapters/index.ts` converts between database snake_case and domain camelCase

### Authentication & Security
- **Three-tier Supabase client setup**:
  - `src/lib/supabase/browser.ts`: Client-side operations
  - `src/lib/supabase/server.ts`: SSR and API routes  
  - `src/lib/supabase/admin.ts`: Admin operations with service role key
- **Middleware security** (`middleware.ts`): CSP with per-request nonces, security headers, rate limiting
- **Input sanitization**: `src/lib/security.ts` with DOMPurify (client) and safe fallbacks (server)
- **Rate limiting**: `src/lib/rate-limiting.ts` with KV/memory fallback
- **Route protection**: Server-side auth checks in API routes and pages

### Component Patterns
- **Domain-organized components**: `src/components/worlds/`, `entities/`, `templates/`, `folders/`
- **Virtualized grids**: `VirtualWorldGrid.tsx`, `VirtualEntityGrid.tsx` with skeleton loaders for performance
- **UI primitives**: `src/components/ui/` (Button, Card, FormField, Input, SmartGrid, VirtualGrid, etc.)
- **Modal patterns**: Create/edit operations with consistent validation and error handling
- **Error boundaries**: React Error Boundary integration with proper fallbacks

### API Design
- **RESTful API routes** under `src/app/api/` with authentication middleware
- **Nested resource routing**: `/api/worlds/[id]/entities`, `/api/worlds/[id]/folders`, etc.
- **Core endpoints**:
  - Worlds: `GET/POST /api/worlds`, `GET/PUT/DELETE /api/worlds/[id]`
  - Entities: `GET/PUT/DELETE /api/entities/[id]`, `POST /api/worlds/[id]/entities`
  - Templates: `GET/PUT/DELETE /api/templates/[id]`, `POST /api/worlds/[id]/templates`
  - Folders: `GET/PUT/DELETE /api/folders/[id]`, `POST /api/worlds/[id]/folders`
  - Invites: `POST /api/worlds/[id]/invites`, `POST /api/invites/accept`
  - Files: `POST /api/worlds/[id]/files/upload`
  - Health: `GET /api/health/db`
- **Admin routes**: `/api/admin/seed-core-templates` with SEED_ADMIN_TOKEN validation

## Key Development Notes

### Windows Compatibility
- Automatic fs.readlink patch applied via `scripts/patch-fs-readlink.cjs`
- Patch is automatically included in dev/build commands

### Database Operations
- **Always use SupabaseWorldService** class for database operations (`src/lib/services/worldService.ts`)
- **Access control**: World ownership uses `owner_id` field (not `user_id` which was removed)
- **Custom fields**: Stored in JSONB columns (entities.data, folders.data, profiles.data)
- **Field naming**: Database uses snake_case, domain uses camelCase (handled by adapters)
- **Generated types**: `src/lib/supabase/types.generated.ts` must be kept in sync with schema changes

### Template System
- System templates available globally, world-specific templates override them
- Template editing creates world-specific overrides instead of modifying system templates
- Template fields define entity structure and validation

### Testing
- API endpoint testing via `npm run test:api`
- Vitest for unit/integration tests
- Test configuration excludes scripts directory from linting

### Seeding
- Core templates seeded via admin endpoint
- Requires SEED_ADMIN_TOKEN for authentication
- Only enabled in development unless ADMIN_SEED_ENABLED=true

## Important Conventions

- **Imports**: Use absolute imports with `@/*` path mapping
- **TypeScript**: Strict mode enabled, Zod for runtime validation
- **Error handling**: Proper error boundaries for major component trees, consistent API error responses
- **State management**: TanStack Query for server state, Zustand for client state
- **Naming**: camelCase for JS/TS variables, kebab-case for files, snake_case in database
- **Database design**: Store custom/dynamic fields in JSONB columns rather than adding schema columns
- **Testing**: Minimal test suite currently, use `npm run test:api` for API endpoint validation

## MCP (Model Context Protocol) Integration

This project includes comprehensive MCP server configuration for enhanced development workflow:

### Available MCP Servers
- **Memory**: Persistent context and note-taking (`@modelcontextprotocol/server-memory`)
- **Filesystem**: File operations and code analysis (`@modelcontextprotocol/server-filesystem`) 
- **Sequential Thinking**: Complex problem solving (`@modelcontextprotocol/server-sequential-thinking`)
- **Supabase Official**: Standard database operations (`@supabase/mcp-server-supabase`)
- **Supabase Advanced**: Advanced database tools (`mcp-supabase`)
- **PostgreSQL**: Raw SQL access (`enhanced-postgres-mcp-server`)
- **Puppeteer**: Browser automation (`puppeteer-mcp-server`)

### Setup Instructions
1. Run `npm run test:mcp` to check configuration status
2. Configure environment variables in `.env.local` (see MCP_SETUP.md)
3. Update `.claude/config.json` with your Supabase credentials
4. Restart Claude Code to load MCP servers

### Usage Examples
- "Use Supabase MCP to show all tables in the database"
- "Use Memory MCP to remember this architecture decision"
- "Use Filesystem MCP to analyze the component structure"
- "Use Sequential Thinking MCP to debug this authentication issue"

See `MCP_SETUP.md` for detailed configuration and usage guide.

## Troubleshooting

### Common Issues
- **Auth failures**: Ensure `NEXT_PUBLIC_SUPABASE_*` environment variables are set and valid
- **Admin/seed operations**: Require `SUPABASE_SERVICE_ROLE_KEY` environment variable  
- **CSP issues**: Development allows unsafe-inline for HMR, production uses strict nonces
- **Database sync**: Run migrations with `npx supabase db push`, regenerate types after schema changes
- **Field consistency**: Database uses snake_case, domain uses camelCase - adapters handle conversion

### Performance Monitoring
- Database optimization views available: `public.index_usage_stats`, `public.table_stats`
- Helper functions for RLS policies: `user_has_world_access`, `user_can_edit_world`, `user_is_world_admin`
- Composite indexes for common query patterns (world access, membership, entity searches)
- GIN indexes for JSONB field searches (entities.data, templates.fields, etc.)