# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development & Port Management
- `npm run dev`: Start development server with auto port cleanup (includes Windows Node 20 readlink patch)
- `npm run dev:clean`: Development with explicit port cleanup (same as predev + dev)
- `npm run dev:all`: Full development stack (server + auto-seed templates when ready)
- `npm run predev`: Auto port cleanup - runs before dev automatically (ports: 3000, 3001, 54321, 5432, 8000)
- `npm run kill-ports`: Manual port cleanup when needed

### Build & Production
- `npm run build`: Build production version (includes readlink patch)
- `npm run start`: Start production server

### Testing & Quality
- `npm run test`: Run tests with Vitest (minimal test suite currently)
- `npm run lint`: Run ESLint with flat config
- `npm run typecheck`: Run TypeScript type checking (use this command frequently, after every change)
- `npm run test:api`: Run API endpoint tests
- `npm run test:mcp`: Test MCP server configuration and connectivity

### Utilities
- `npm run seed:core`: Seed core system templates (requires dev server running)

### Database Operations
- Apply migrations: Use Supabase SQL editor, Supabase CLI (`npx supabase db push`), or direct psql
- Regenerate types: `npx supabase gen types typescript --project-id rkjtxcavocbhhwuywduj --schema public > src/lib/supabase/types.generated.ts`

## Environment Setup

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations
- `OPENAI_API_KEY`: OpenAI API key for AI generation features

Optional environment variables for development:
- `SEED_ADMIN_TOKEN`: Random secret for seeding endpoints
- `SEED_BASE_URL`: Base URL for seeding (default: http://localhost:3000)
- `ADMIN_SEED_ENABLED`: Enable seeding in production (default: false)

### Node Version Management
- Use Node 20 LTS as specified in `.nvmrc`
- Run `nvm use` to ensure version consistency across development environments
- Port management automatically handles common development ports to prevent EADDRINUSE errors

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.5.2 with App Router
- **UI**: React 19.1.0 with Tailwind CSS 4.1.13 (CSS variables, no config file needed)
- **Database**: Supabase with PostgreSQL and Row Level Security
- **State Management**: Zustand for client state, TanStack Query for server state
- **Authentication**: Supabase Auth with SSR support
- **AI Integration**: OpenAI API with gpt-4o-mini for text and dall-e-3 for images
- **Testing**: Vitest with API endpoint validation
- **Type Safety**: TypeScript with strict mode, Zod for runtime validation
- **Deployment**: Vercel with automatic builds

### Project Structure
- `src/app/`: Next.js App Router pages and API routes
- `src/components/`: Reusable React components organized by domain
  - `src/components/ai/`: AI generation UI components (AIGenerateButton, AIPromptModal)
- `src/lib/`: Core utilities and services
  - `src/lib/supabase/`: Supabase client configurations (browser/server)
  - `src/lib/services/`: Domain service layers (SupabaseWorldService, AIService)
  - `src/lib/types.ts`: Core domain types including AI generation interfaces
- `src/hooks/`: React hooks split by queries and mutations
  - `src/hooks/mutations/`: Includes AI generation hooks (useGenerateTemplate, useGenerateEntityFields, useGenerateImage)
- `src/providers/`: React context providers

### Core Domain Model
The application manages "worlds" containing entities, templates, folders, and relationships:
- **World**: Top-level container with members, settings, and content
- **Entity**: Individual items in a world with custom fields based on templates
- **Template**: Defines field schemas for entities (supports system-wide and world-specific)
- **Folder**: Organizes entities within a world
- **Relationship**: Links between entities with typed connections

### Data Layer Architecture
- **Unified Service Layer**: Modern service abstraction with interface-based architecture (`src/lib/services/unified-service.ts`)
  - **IWorldService, IEntityService, ITemplateService, IFolderService, IRelationshipService**: Clean service interfaces
  - **UnifiedServiceLayer**: Orchestrates all service interactions with centralized error handling
  - **ServiceError hierarchy**: NotFoundError, AccessDeniedError, DatabaseError, ValidationError for proper error handling
- **SupabaseWorldService**: Legacy service class still used for complex operations (`src/lib/services/worldService.ts`)
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
- **Drag-and-Drop Integration**: Comprehensive drag-and-drop across all content components
  - **Draggable Components**: EntityCard, TemplateCard with `onDragStart` prop support
  - **Drop Zones**: FolderCard accepts appropriate content types, UngroupedEntitiesDropZone, UngroupedTemplatesDropZone
  - **Visual Feedback**: Hover states, drop indicators, smooth animations during drag operations
  - **Type Safety**: Validates drop compatibility (entities → entity folders, templates → template folders)
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
  - Relationships: `GET/POST /api/worlds/[id]/relationships`, `PUT/DELETE /api/relationships/[id]`
  - Invites: `POST /api/worlds/[id]/invites`, `POST /api/invites/accept`
  - Files: `POST /api/worlds/[id]/files/upload`
  - Health: `GET /api/health/db`
- **AI Generation endpoints**: `/api/ai/generate-template`, `/api/ai/generate-entity-fields`, `/api/ai/generate-image`
- **Admin routes**: `/api/admin/seed-core-templates` with SEED_ADMIN_TOKEN validation

### AI Generation Architecture
- **AIService** (`src/lib/services/aiService.ts`): Centralized OpenAI integration with comprehensive world context building
  - **Template Generation**: Creates templates from user prompts using world context
  - **Entity Field Generation**: Generates field values for entities based on template structure and world context
  - **Image Generation**: Creates entity images and world cover images using DALL-E 3
  - **World Context Integration**: Uses ALL extended world fields (logline, genre, tone, themes, technology level, magic level, cosmology, climate, society, conflicts, rules, aesthetics)
- **Permission System**: AI generation restricted to world owners and admins only
- **Error Handling**: Comprehensive error handling with user-friendly messages and proper logging
- **UI Components**: Reusable `AIGenerateButton` and `AIPromptModal` for consistent AI generation experience
- **Mutation Hooks**: Type-safe React Query mutations with optimistic updates and error handling

## Key Development Notes

### Windows Compatibility & Port Management
- Automatic fs.readlink patch applied via `scripts/patch-fs-readlink.cjs`
- Patch is automatically included in dev/build commands
- **Port cleanup**: `predev` script automatically kills processes on ports 3000, 3001, 54321, 5432, 8000
- **Process management**: Uses `concurrently -k` for graceful shutdown preventing zombie processes
- **Manual cleanup**: Use `npm run kill-ports` if ports remain busy

### Database Operations
- **Always use SupabaseWorldService** class for database operations (`src/lib/services/worldService.ts`)
- **Access control**: World ownership uses `owner_id` field (not `user_id` which was removed)
- **Custom fields**: Stored in JSONB columns (entities.data, folders.data, profiles.data)
- **Field naming**: Database uses snake_case, domain uses camelCase (handled by adapters)
- **Generated types**: `src/lib/supabase/types.generated.ts` must be kept in sync with schema changes

### Drag-and-Drop System
- **Native HTML5 API**: Uses native drag-and-drop with proper dataTransfer handling
- **Component Integration**: All grid components support drag handlers via `onDragStart` props
- **Folder Organization**: Entities and templates can be moved into appropriate folder types
- **Mutation Hooks**: Uses `useUpdateEntity` and `useUpdateTemplate` for database updates with folderId changes
- **Visual Feedback**: Consistent drag states, drop zones, and success notifications across all components

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

This project includes comprehensive MCP server configuration for enhanced development workflow. All MCP servers are configured in `.mcp.json` which Claude Code automatically loads.

### Available MCP Servers
- **Memory**: Persistent context and note-taking (`@modelcontextprotocol/server-memory`)
- **Filesystem**: File operations and code analysis (`@modelcontextprotocol/server-filesystem`)
- **Shell**: Command execution with PowerShell support (`@modelcontextprotocol/server-shell`)
- **Sequential Thinking**: Complex problem solving (`@modelcontextprotocol/server-sequential-thinking`)
- **Supabase Official**: Standard database operations (`@supabase/mcp-server-supabase`)
- **Supabase Advanced**: Advanced database tools (`mcp-supabase`)
- **PostgreSQL**: Raw SQL access (`enhanced-postgres-mcp-server`)
- **Puppeteer**: Browser automation (`puppeteer-mcp-server`)

### Setup Instructions
1. Run `npm run test:mcp` to check configuration status
2. Configure environment variables in `.env.local` (see MCP_SETUP.md)
3. MCP servers are automatically loaded from `.mcp.json` configuration
4. Restart Claude Code to reload MCP servers after configuration changes

### Usage Examples
- "Use Supabase MCP to show all tables in the database"
- "Use Memory MCP to remember this architecture decision"
- "Use Filesystem MCP to analyze the component structure"
- "Use Sequential Thinking MCP to debug this authentication issue"

See `MCP_SETUP.md` for detailed configuration and usage guide.

## Recent Updates & Fixes

### September 2025 - AI Generation System Implementation
- **Comprehensive AI Integration**: Full OpenAI integration with gpt-4o-mini for text and dall-e-3 for images
  - **AIService Class**: Centralized service for all AI generation operations (`src/lib/services/aiService.ts`)
  - **Template Generation**: AI-powered template creation from user prompts with world context
  - **Entity Field Generation**: Generate field values for entities based on template structure and world information
  - **Image Generation**: Entity images and world cover images using DALL-E 3 with contextual prompts
  - **World Context Integration**: Uses ALL extended world fields for rich contextual generation
- **API Endpoints**: Complete REST API for AI generation operations
  - `/api/ai/generate-template`: Generate templates from prompts
  - `/api/ai/generate-entity-fields`: Generate entity field values
  - `/api/ai/generate-image`: Generate entity and world cover images
  - **Permission System**: Restricted to world owners and admins with proper authentication
- **UI Components**: Reusable AI generation components integrated into existing workflows
  - **AIGenerateButton**: Consistent AI generation trigger with loading states
  - **AIPromptModal**: Modal for entering generation prompts with validation
  - **Template Generation UI**: Integrated into CreateTemplateModal with "Generate with AI" button
- **Type Safety & Error Handling**: Comprehensive TypeScript types and error handling with user-friendly messages

### September 2025 - Drag-and-Drop & Unified Service Layer
- **Comprehensive Drag-and-Drop Implementation**: Full drag-and-drop support for organizing content
  - **Entity Drag-and-Drop**: Drag entities from grids into entity folders or back to ungrouped state
  - **Template Drag-and-Drop**: Drag templates from grids into template folders or back to ungrouped state
  - **Visual Feedback**: Smooth animations, hover states, and drop zone indicators
  - **Type Safety**: Validates drop targets (entities only to entity folders, templates only to template folders)
  - **Real-time Updates**: Uses TanStack Query mutations with optimistic updates and error handling
  - **Cross-component Integration**: Consistent drag-and-drop across EntityCard, TemplateCard, FolderCard, EntityGrid, TemplateGrid, VirtualEntityGrid, VirtualTemplateGrid
- **Unified Service Layer Implementation**: Comprehensive service abstraction layer (`src/lib/services/unified-service.ts`)
  - **Interface-based Architecture**: Clear separation of concerns with IWorldService, IEntityService, ITemplateService, IFolderService, IRelationshipService
  - **Error Handling**: Centralized error handling with ServiceError, NotFoundError, AccessDeniedError, DatabaseError, ValidationError
  - **Database Adapter Pattern**: Consistent snake_case ↔ camelCase conversion across all data operations
  - **Service Composition**: UnifiedServiceLayer class that orchestrates all service interactions

### September 2025 - Template Folders & Relationship System Fixes
- **Template Folder System**: Added support for template folders with proper differentiation
  - Added `kind` column to folders table to differentiate between 'entities' and 'templates' folders
  - Applied migration `20250912185500_add_kind_to_folders.sql` with performance indexing
  - Fixed template folder display issues and removed hardcoded empty arrays
  - Updated folder creation workflow to properly handle template vs entity folder types
- **Relationship Creation Fixed**: Resolved 500 errors when creating relationships between entities
  - Fixed RLS (Row Level Security) policy violations on relationships table with `service_role` checks
  - Applied migration `20250912150110_fix_relationships_rls_policy.sql` with comprehensive policies
  - Updated all API endpoints to use `supabaseWorldService` with admin client fallback support
- **UI/UX Improvements**: Complete relationship creation workflow with proper feedback
  - Added `useCreateRelationship` mutation hook with TanStack Query integration
  - Success toast notifications showing relationship details: "Entity A relationship Entity B"
  - Auto-refresh relationships table after creation via query invalidation
  - Fixed RelationshipTable component to use TanStack Query instead of deprecated Zustand store
- **TypeScript & Error Handling**: Comprehensive error handling with specific user-friendly messages
  - Proper validation with Zod schemas for relationship data
  - Fixed all TypeScript compilation errors and type safety issues

### September 2025 - Build & Configuration Fixes  
- **Port Management**: Added automatic port cleanup with `kill-port`, `concurrently` for graceful process management, preventing zombie Node processes and EADDRINUSE errors
- **Node Version Standardization**: Added `.nvmrc` for Node 20 LTS consistency across development environments
- **PostCSS Configuration**: Fixed PostCSS config for Tailwind CSS v4. Requires `@tailwindcss/postcss` plugin with correct syntax to resolve Vercel build failures.
- **Tailwind CSS v4.1.13**: Updated to latest version with CSS variables for theming. No `tailwind.config.ts` needed for v4.
- **Field Consistency**: Completed comprehensive database field naming audit ensuring snake_case in database, camelCase in domain.
- **Authentication Issues**: Fixed SSR initialization and AuthContext problems affecting world loading.
- **Database Optimizations**: Added performance monitoring views and optimized indexes for common query patterns.

## Troubleshooting

### Common Issues
- **Port conflicts (EADDRINUSE)**: Run `npm run kill-ports` or use `npm run dev:clean` - automatic `predev` cleanup prevents zombie Node processes
- **Auth failures**: Ensure `NEXT_PUBLIC_SUPABASE_*` environment variables are set and valid
- **Build failures**: Tailwind v4 requires proper PostCSS config with `@tailwindcss/postcss` plugin
- **Admin/seed operations**: Require `SUPABASE_SERVICE_ROLE_KEY` environment variable  
- **Node version inconsistency**: Use `nvm use` to match `.nvmrc` (Node 20 LTS)
- **CSP issues**: Development allows unsafe-inline for HMR, production uses strict nonces
- **Database sync**: Run migrations with `npx supabase db push`, regenerate types after schema changes
- **Field consistency**: Database uses snake_case, domain uses camelCase - adapters handle conversion
- **Windows compatibility**: Automatic fs.readlink patch applied via `scripts/patch-fs-readlink.cjs`
- **Relationship creation failures**: Check RLS policies have `service_role` exceptions, ensure `supabaseWorldService` is used for admin operations
- **Template folder issues**: Ensure folders have correct `kind` field ('entities' or 'templates') for proper display
- **UI not refreshing**: Components should use TanStack Query hooks, not deprecated Zustand store (`useStore`)
- **Drag-and-drop issues**: Ensure components have proper drag handlers (onDragStart) and drop handlers (onDrop), verify folder kind matching (entities to entity folders, templates to template folders)
- **Service layer errors**: Use unified service interfaces and proper error handling - check `src/lib/services/unified-service.ts` for standardized patterns
- **AI generation failures**: Ensure `OPENAI_API_KEY` is set in environment variables, check user has proper permissions (world owner/admin), verify world context data is available
- **AI generation timeout**: OpenAI API calls may take 10-30 seconds, ensure proper loading states and user feedback
- **AI image generation costs**: DALL-E 3 charges per image generated, consider rate limiting for production use

### Performance Monitoring
- Database optimization views available: `public.index_usage_stats`, `public.table_stats`
- Helper functions for RLS policies: `user_has_world_access`, `user_can_edit_world`, `user_is_world_admin`
- Composite indexes for common query patterns (world access, membership, entity searches)
- GIN indexes for JSONB field searches (entities.data, templates.fields, etc.)

Always make sure all tests pass (especially typescript) before committing changes to git
- image model for ai generation is gpt-image-1 and the text model is gpt-5-mini. do not ever change them unless the user asks.