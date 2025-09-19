# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WorldWeaver UI is a Next.js 15.5.2 application with React 19.1.0 for collaborative world-building and storytelling. It's a sophisticated content management system with authentication, file handling, AI integration, and real-time collaboration features.

**Core Domain**: Users create Worlds containing Entities, Templates, Folders, Relationships, and Maps. Users can invite others to collaborate on worlds with role-based permissions.

## Essential Development Commands

### Development
- `npm run dev` - Start development server with Windows fs patch and auto port cleanup
- `npm run dev:clean` - Development with explicit port cleanup (kills processes on ports 3000, 3001, 54321, 5432, 8000)
- `npm run dev:all` - Full stack: dev server + auto-seed core templates
- `npm run predev` - Automatically runs before dev to cleanup ports

### Build & Production
- `npm run build` - Production build with optimization and bundle analysis
- `npm run build:analyze` - Build with bundle analyzer (set ANALYZE=true)
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - ESLint with Next.js v15 flat config
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run typecheck` - TypeScript compilation check
- `npm run test` - Run Vitest test suite
- `npm run test:api` - Test API endpoints specifically

### Database & Seeding
- `npm run seed:core` - Seed core system templates via admin API
- `npm run test:mcp` - Test MCP server configuration

### Utilities
- `npm run kill-ports` - Manual port cleanup for zombie Node processes
- `npm run check-api-health` - Check OpenAI usage and API health

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15.5.2 App Router, React 19.1.0, TypeScript, Tailwind CSS 4.1.13
- **Backend**: Next.js API routes with middleware, Supabase PostgreSQL with RLS
- **State Management**: TanStack Query for server state, Zustand for client state
- **Authentication**: Supabase Auth with SSR support
- **Styling**: Tailwind CSS 4.1.13 with design tokens
- **Testing**: Vitest, API endpoint validation
- **AI Integration**: OpenAI integration for content generation

### Key Architectural Patterns

#### Service Layer Architecture
The application uses a unified service layer pattern for data access:

- **Primary Service**: `supabaseWorldService` in `src/lib/services/supabaseWorldService.ts`
- **Unified Service**: `SimplifiedUnifiedServiceLayer` in `src/lib/services/unified-service.ts`
- **Error Handling**: Centralized error handling in `src/lib/services/errors.ts`
- **Interface Contracts**: Service interfaces in `src/lib/services/interfaces.ts`

**Critical Pattern**: Always use `supabaseWorldService` for database operations as it includes proper admin client fallback and RLS policy handling.

#### Authentication & Data Access
- **Server Client**: `src/lib/supabase/server.ts` - Server-side operations
- **Browser Client**: `src/lib/supabase/browser.ts` - Client-side operations
- **Admin Client**: `src/lib/supabase/admin.ts` - Service role operations for admin tasks
- **Type Definitions**: `src/lib/supabase/types.ts` - Canonical type exports

**Security Note**: Admin operations require `SUPABASE_SERVICE_ROLE_KEY` environment variable.

#### Data Layer & Types
- **Generated Types**: `src/lib/supabase/types.generated.ts` (auto-generated, don't edit)
- **Type Exports**: `src/lib/supabase/types.ts` (convenience exports)
- **Domain Types**: Core business logic types like `World`, `Entity`, `Template`, `Folder`

#### API Structure
All API routes are authenticated and follow RESTful patterns:

```
/api/worlds/                    # User's worlds
/api/worlds/[id]/               # World operations
/api/worlds/[id]/entities/      # World entities
/api/worlds/[id]/templates/     # World templates
/api/worlds/[id]/folders/       # World folders
/api/worlds/[id]/relationships/ # Entity relationships
/api/worlds/[id]/members/       # World members & invites
/api/worlds/[id]/maps/          # World maps
/api/entities/[id]/             # Entity operations
/api/templates/[id]/            # Template operations
/api/folders/[id]/              # Folder operations
/api/admin/                     # Admin operations (seeding, etc.)
/api/ai/                        # AI generation endpoints
```

#### Component Architecture
The UI follows a modular component structure with performance optimizations:

- **Smart Grids**: `src/components/ui/SmartGrid.tsx` automatically switches between regular and virtual grids based on item count
- **Lazy Loading**: `src/components/lazy/` contains performance-optimized lazy-loaded components
- **Virtualization**: Uses virtual scrolling for large datasets (threshold: 100+ items)
- **Skeleton Loading**: Consistent skeleton states across all grid components

#### State Management Patterns
- **Server State**: TanStack Query hooks in `src/hooks/query/`
- **Mutations**: TanStack Query mutations in `src/hooks/mutations/`
- **Client State**: Zustand stores for UI state
- **Form Handling**: React Hook Form with Zod validation

**Important**: All data fetching should use TanStack Query hooks, not direct API calls or the deprecated Zustand store.

### Database & Migration Patterns

#### Database Schema
- **Core Tables**: `worlds`, `entities`, `templates`, `folders`, `relationships`, `world_members`
- **Supporting Tables**: `profiles`, `activity_logs`, `world_invites`, `files`, `maps`
- **RLS Policies**: Row Level Security enforced on all tables
- **Indexes**: Composite indexes for common query patterns

#### Migration Management
- **Location**: `supabase/migrations/`
- **Naming**: `YYYYMMDD_HHMMSS_description.sql`
- **Application**: Use Supabase CLI or psql for applying migrations
- **Helper Functions**: RLS helper functions like `user_has_world_access()`, `user_can_edit_world()`

### Security & Middleware

#### Security Headers & CSP
The `middleware.ts` implements comprehensive security:
- **CSP**: Nonce-based Content Security Policy
- **Headers**: HSTS, X-Frame-Options, X-Content-Type-Options
- **Rate Limiting**: KV-based with memory fallback
- **CSRF Protection**: Built into middleware

#### Environment Variables
Required variables for development:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Required for admin operations
```

## Development Workflow & Patterns

### File Organization Rules
- **Never save working files to the root folder**
- **Components**: Organize by feature in `src/components/`
- **Pages**: App Router pages in `src/app/`
- **Utilities**: Library functions in `src/lib/`
- **Services**: Data access layer in `src/lib/services/`
- **Types**: Centralized in `src/lib/supabase/types.ts`

### Component Development Patterns

#### Performance Optimization
- Use `SmartGrid` component for lists (automatically virtualizes when >100 items)
- Implement skeleton loading states for all data-loading components
- Use `Suspense` boundaries with lazy-loaded components
- Follow the virtualization thresholds: simple (200), standard (100), complex (50), heavy (25)

#### Form Handling
```typescript
// Standard pattern for forms
const form = useForm({
  resolver: zodResolver(validationSchema),
  defaultValues: { ... }
});

// Mutation with optimistic updates
const mutation = useMutation({
  mutationFn: apiCall,
  onSuccess: () => {
    queryClient.invalidateQueries(['cache-key']);
    toast({ title: 'Success', variant: 'success' });
  }
});
```

#### Error Handling
- Use `ServiceError` classes from `src/lib/services/errors.ts`
- Implement proper error boundaries
- Provide user-friendly error messages
- Log errors with context using `logError()` from `src/lib/logging.ts`

### API Development Patterns

#### Route Handler Structure
```typescript
export const GET = withApiErrorHandling(async (request: NextRequest) => {
  const { user, error } = await getServerClientAndUser();
  if (error || !user) return apiAuthRequired();

  // Implementation
  return apiSuccess(data);
});
```

#### Service Layer Usage
```typescript
// Always use the service layer
import { supabaseWorldService } from '@/lib/services/supabaseWorldService';

// Correct pattern
const worlds = await supabaseWorldService.getUserWorlds(userId);

// Avoid direct Supabase calls in API routes
```

### Database Development Patterns

#### Creating Migrations
1. **Design the change** - Plan table structure, indexes, policies
2. **Write migration** - Use timestamp naming convention
3. **Test locally** - Apply and verify migration works
4. **Update types** - Regenerate TypeScript types if schema changes
5. **Update services** - Modify service layer to handle new fields

#### RLS Policy Patterns
```sql
-- Standard world access policy
CREATE POLICY "world_access" ON worlds
  FOR ALL USING (
    user_has_world_access(auth.uid(), id) OR
    auth.role() = 'service_role'
  );
```

## Common Development Tasks

### Adding a New API Endpoint
1. Create route handler in `src/app/api/`
2. Implement authentication check
3. Add request validation with Zod
4. Use service layer for data access
5. Add proper error handling
6. Create corresponding TanStack Query hook
7. Update API documentation

### Adding a New Component
1. Check existing components for similar patterns
2. Use TypeScript with proper prop types
3. Implement skeleton loading state
4. Add error boundaries if needed
5. Consider performance implications (virtualization)
6. Follow accessibility best practices

### Database Schema Changes
1. Create migration file
2. Update RLS policies if needed
3. Regenerate TypeScript types
4. Update service layer methods
5. Update API endpoints
6. Update frontend components
7. Test migration thoroughly

### Adding AI Features
1. Use existing AI service patterns in `src/lib/services/aiService.ts`
2. Implement proper error handling for API failures
3. Add loading states and user feedback
4. Consider rate limiting and costs
5. Follow security best practices for API keys

## Testing Patterns

### API Testing
- Use `npm run test:api` to validate API endpoints
- Test authentication flows
- Validate request/response schemas
- Test error conditions

### Component Testing
- Use Vitest for component testing
- Mock API calls appropriately
- Test loading states and error conditions
- Validate accessibility requirements

## Windows Development

This project includes specific Windows compatibility fixes:
- **fs.readlink patch**: Applied automatically via `scripts/patch-fs-readlink.cjs`
- **Port management**: Automatic cleanup prevents zombie Node processes
- **Path handling**: Uses proper path resolution for Windows

## Performance Considerations

### Bundle Optimization
- Next.js 15+ uses SWC compiler by default
- Package imports are optimized for `@supabase/supabase-js` and `@tanstack/react-query`
- Bundle analyzer available with `npm run build:analyze`

### Database Performance
- Composite indexes for common query patterns
- JSONB fields for flexible data storage
- Performance monitoring views available
- RLS policies optimized for minimal overhead

### Frontend Performance
- Virtual scrolling for large datasets
- Skeleton loading states
- Image optimization with Next.js
- Code splitting with dynamic imports

## Troubleshooting

### Common Issues
- **Port conflicts**: Run `npm run kill-ports` or `npm run dev:clean`
- **Build failures**: Ensure Tailwind v4 PostCSS config is correct
- **Auth failures**: Verify Supabase environment variables
- **Admin operations**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
- **Windows issues**: fs.readlink patch should apply automatically
- **Relationship creation errors**: Check RLS policies include `service_role` exceptions

### Performance Issues
- Use virtual grids for large datasets
- Check database query patterns
- Monitor bundle size with analyzer
- Review API response times

### Database Issues
- Check RLS policies for permission errors
- Verify service role key for admin operations
- Use helper functions for complex access patterns
- Monitor database performance views

## Environment Setup

### Required Tools
- **Node.js 20 LTS** (see `.nvmrc`)
- **npm** (uses `package-lock.json`)
- **Supabase account** with project configured

### Development Setup
1. `npm install`
2. Copy `.env.local.example` to `.env.local` and configure
3. Apply database migrations: `npx supabase db push`
4. Seed core templates: `npm run seed:core`
5. Start development: `npm run dev`

### Environment Variables
See `.env.local.example` for required configuration. Key variables:
- Supabase URL and keys
- OpenAI API key for AI features
- Admin seed token for template seeding

This architecture prioritizes type safety, performance, security, and developer experience while maintaining scalability for collaborative world-building features.