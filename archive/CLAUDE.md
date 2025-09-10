# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- `npm run dev`: Start development server (includes Windows Node 22 readlink patch)
- `npm run build`: Build production version (includes readlink patch)
- `npm run start`: Start production server
- `npm run test`: Run tests with Vitest
- `npm run lint`: Run ESLint with flat config
- `npm run seed:core`: Seed core system templates (requires dev server running)
- `npm run test:api`: Run API endpoint tests
- `npm run test:mcp`: Test MCP server configuration and connectivity

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
- **SupabaseWorldService**: Main service class handling all database operations
- **Type-safe database operations**: Uses generated types from Supabase schema
- **Row Level Security (RLS)**: Enforced at database level for all tables
- **JSONB fields**: Flexible custom data storage (entities.data, folders.data, etc.)

### Authentication & Security
- Server-side authentication with Supabase SSR
- Client-side auth context with automatic token refresh
- Route protection via middleware and server-side checks
- Input sanitization with DOMPurify and Zod validation
- CSP headers and security middleware implemented

### Component Patterns
- Domain-organized components (worlds/, entities/, templates/, folders/)
- Modal components for create/edit operations
- Grid layouts for listing items (WorldGrid, EntityGrid, etc.)
- Consistent error boundaries and loading states
- Toast notifications for user feedback

### API Design
- RESTful API routes under `src/app/api/`
- Nested resource routing (e.g., `/api/worlds/[id]/entities`)
- Consistent error handling and response formatting
- Admin routes protected with token validation

## Key Development Notes

### Windows Compatibility
- Automatic fs.readlink patch applied via `scripts/patch-fs-readlink.cjs`
- Patch is automatically included in dev/build commands

### Database Operations
- Always use the SupabaseWorldService class for database operations
- Access control enforced through world ownership checks
- Custom fields stored in JSONB columns for flexibility

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

- Use absolute imports with `@/*` path mapping
- Follow strict TypeScript configuration
- Implement proper error boundaries for all major component trees
- Use TanStack Query for all server state management
- Maintain consistent naming: camelCase for JS/TS, kebab-case for files
- Store custom/dynamic fields in JSONB columns rather than adding schema columns

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