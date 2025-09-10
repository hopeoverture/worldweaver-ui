﻿# WorldWeaver UI - Development Documentation

> Note: Portions of this document may be outdated or contain encoding artifacts. For the authoritative quickstart and environment details, see `README.md` and `SUPABASE_AUTH_SETUP.md`.

**Last Updated:** September 8, 2025  
**Version:** 0.1.0  
**Build Status:** Active Development  
**Latest Changes:** Complete Supabase authentication integration, protected API routes, authenticated user sessions, and fixed store authentication context

## ðŸš€ Project Overview

WorldWeaver is a sophisticated world-building application designed for creative professionals, writers, and game developers. It provides a comprehensive platform for creating, organizing, and managing fictional worlds with entities, relationships, and custom templates.

### Key Features
- **World Management:** Create and organize multiple fictional worlds
- **Entity System:** Define characters, locations, items, and custom entities
- **Template Engine:** Create reusable templates with custom fields
- **Relationship Mapping:** Visual and tabular relationship management with notes and context
- **Folder Organization:** Organize entities and templates into folders
- **Advanced UI:** Modern interface with premium hover effects and animations
- **Local Database:** PostgreSQL integration for persistent data storage
- **Comprehensive Creation Workflows:** Multi-step wizards for worlds, entities, templates, and relationships

## ðŸ› ï¸ Technology Stack

### Core Framework
- **Next.js 15.5.2** - React framework with App Router and API routes
- **React 19.1.0** - Latest React with modern hooks
- **TypeScript 5** - Full type safety throughout the application

### API Architecture
- **Next.js API Routes** - Server-side database operations
- **RESTful Endpoints** - Clean separation between client and server
- **Async/Await Patterns** - Modern JavaScript for data fetching

### Database & Persistence
- **Supabase Production Database** - Cloud-hosted PostgreSQL with complete schema and RLS policies
- **Supabase Auth** - Complete authentication system with login/register flows  
- **TypeScript Integration** - Auto-generated database types from live schema
- **Row Level Security** - User-scoped data access with authenticated sessions
- **Protected API Routes** - Server-side authentication verification

### Styling & UI
- **Tailwind CSS 4.1.13** - Utility-first CSS framework with modern features
- **PostCSS 8.5.6** - CSS processing with Tailwind integration
- **Custom Components** - Reusable UI component library

### 11. State Management
- **Zustand 5.0.8** - Lightweight state management with async actions

### Development Tools
- **ESLint 9** - Code linting with Next.js configuration
- **Vitest** - Testing framework (configured but not extensively used yet)

## ðŸ—„ï¸ Database Architecture

### Complete Supabase Integration
- **Production Database** - Deployed to Supabase project: `rkjtxcavocbhhwuywduj`
- **Authentication System** - Complete Supabase Auth with protected routes
- **Row Level Security** - User-scoped data access policies on all tables
- **TypeScript Types** - Auto-generated from live database schema via `src/lib/supabase/types.generated.ts` (re-exported by `src/lib/supabase/types.ts`)
- **API Authentication** - Server-side session verification with middleware

### Supabase Configuration
- **Project URL:** `https://rkjtxcavocbhhwuywduj.supabase.co`
- **Database Schema:** 8 tables with complete relationships and constraints
- **RLS Policies:** User-scoped access control on all data operations
- **Authentication:** Email/password with profile management
- **Environment:** Configured in `.env.local` with service role keys

### Supabase API Routes
- Worlds: `GET /api/worlds`, `GET/PUT/DELETE /api/worlds/[id]`
- Entities: `GET/POST /api/worlds/[id]/entities`, `GET/PUT/DELETE /api/entities/[id]`
- Templates: `GET/POST /api/worlds/[id]/templates`, `PUT/DELETE /api/templates/[id]`
- Folders: `GET/POST /api/worlds/[id]/folders`, `GET/PUT/DELETE /api/folders/[id]`
- Invites: `POST/GET /api/worlds/[id]/invites`, `DELETE /api/worlds/[id]/invites/[inviteId]`, `POST /api/invites/accept`
- Relationships: `GET/POST /api/worlds/[id]/relationships`, `PUT/DELETE /api/relationships/[id]`
- Authentication Middleware: security headers + light rate limiting on key API endpoints
- Type-Safe Responses: consistent JSON response formats with TypeScript
- Unauthenticated: protected routes return 401 (no mock fallback)

### Database Schema
- **auth.users** - Supabase authentication (managed by Supabase)
- **public.profiles** - User profile information and preferences
- **public.worlds** - World/project containers with user ownership
- **public.world_members** - Collaboration and permissions system
- **public.world_invites** - Invitation system for collaboration
- **public.templates** - Entity templates (system & custom)
- **public.folders** - Organization structure for entities and templates
- **public.entities** - World-building content (characters, locations, etc.)
- **public.relationships** - Edges between entities with unique (from,to,type)
- **public.world_bans** - World-level bans
- **public.activity_logs** - Append-only activity records
- **public.world_files** - File metadata paired with Storage

### Authentication Context
```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}
```

### Supabase Service Layer
```typescript
// src/lib/supabase/browser.ts
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// src/lib/services/supabaseWorldService.ts
export class SupabaseWorldService {
  async getUserWorlds(userId: string): Promise<World[]>
  async createWorld(worldData: any, userId: string): Promise<World>
  async updateWorld(worldId: string, updates: any): Promise<World>
  async deleteWorld(worldId: string): Promise<void>
}
```

### World Service Adapter
```typescript
// src/lib/services/worldService.ts
export class WorldService {
  async getUserWorlds(userId: string): Promise<World[]>
  async getWorldById(worldId: string, userId: string): Promise<World>
  async createWorld(data: WorldCreate, userId: string): Promise<World>
  async updateWorld(worldId: string, data: Partial<World>): Promise<World>
  async deleteWorld(worldId: string): Promise<void>
  async archiveWorld(worldId: string, archived: boolean): Promise<void>
}
```

### Authenticated Store Architecture
```typescript
// src/lib/store.ts
type State = {
  worlds: World[];
  isLoading: boolean;
  error: string | null;
};

type Actions = {
  loadUserWorlds: () => Promise<void>;           // Uses authenticated session
  addWorld: (w: WorldCreate) => Promise<World>;   // Authenticated user context
  updateWorld: (id: string, patch: Partial<World>) => Promise<void>;
  deleteWorld: (id: string) => Promise<void>;
  clearError: () => void;
};
```

### Connection Details
- **Supabase Project:** `rkjtxcavocbhhwuywduj`
- **Database URL:** Configured via environment variables
- **Authentication:** Supabase Auth with email/password
- **Environment:** Production Supabase instance with full schema

## ðŸ“ Project Structure

```
worldweaver-ui/
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ app/                     # Next.js App Router pages
â”‚   â”‚   â”œâ”€â”€ api/                 # Next.js API routes
â”‚   â”‚   â”‚   â””â”€â”€ worlds/          # World CRUD endpoints
â”‚   â”‚   â”‚       â”œâ”€â”€ route.ts     # GET all worlds, POST new world
â”‚   â”‚   â”‚       â””â”€â”€ [id]/route.ts # GET, PUT, DELETE by ID
â”‚   â”‚   â”œâ”€â”€ page.tsx            # Dashboard/Home page with async loading
â”‚   â”‚   â”œâ”€â”€ layout.tsx          # Root layout with providers
â”‚   â”‚   â”œâ”€â”€ globals.css         # Global styles and Tailwind
â”‚   â”‚   â”œâ”€â”€ favicon.ico         # Application favicon
â”‚   â”‚   â”œâ”€â”€ settings/           # Settings page
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx        # Settings implementation
â”‚   â”‚   â”œâ”€â”€ profile/            # Profile page
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx        # User profile management
â”‚   â”‚   â””â”€â”€ world/[id]/         # Dynamic world pages
â”‚   â”‚       â””â”€â”€ page.tsx        # Individual world view
â”‚   â”œâ”€â”€ components/             # Reusable React components
â”‚   â”‚   â”œâ”€â”€ ui/                 # Base UI components
â”‚   â”‚   â”‚   â”œâ”€â”€ Button.tsx      # Primary action button
â”‚   â”‚   â”‚   â”œâ”€â”€ Card.tsx        # Container component
â”‚   â”‚   â”‚   â”œâ”€â”€ CommandPalette.tsx # Quick action interface
â”‚   â”‚   â”‚   â”œâ”€â”€ EmptyState.tsx  # Empty state placeholder
â”‚   â”‚   â”‚   â”œâ”€â”€ Input.tsx       # Form input component
â”‚   â”‚   â”‚   â”œâ”€â”€ Kbd.tsx         # Keyboard shortcut display
â”‚   â”‚   â”‚   â”œâ”€â”€ Modal.tsx       # Overlay modal dialog
â”‚   â”‚   â”‚   â”œâ”€â”€ Select.tsx      # Dropdown selection
â”‚   â”‚   â”‚   â”œâ”€â”€ Spinner.tsx     # Loading indicator
â”‚   â”‚   â”‚   â”œâ”€â”€ Tabs.tsx        # Tabbed interface
â”‚   â”‚   â”‚   â”œâ”€â”€ Textarea.tsx    # Multi-line text input
â”‚   â”‚   â”‚   â””â”€â”€ Toggle.tsx      # Toggle switch
â”‚   â”‚   â”œâ”€â”€ dashboard/          # Dashboard-specific components
â”‚   â”‚   â”‚   â”œâ”€â”€ TabNav.tsx      # Dashboard navigation tabs
â”‚   â”‚   â”‚   â””â”€â”€ WorldContextBar.tsx # World context info
â”‚   â”‚   â”œâ”€â”€ entities/           # Entity management components
â”‚   â”‚   â”‚   â”œâ”€â”€ EntityCard.tsx  # Entity display card
â”‚   â”‚   â”‚   â”œâ”€â”€ EntityGrid.tsx  # Entity grid layout
â”‚   â”‚   â”‚   â”œâ”€â”€ EntityDetailModal.tsx # Entity view/edit modal
â”‚   â”‚   â”‚   â””â”€â”€ CreateEntityModal/ # Multi-step entity creation
â”‚   â”‚   â”‚       â”œâ”€â”€ CreateEntityModal.tsx # Main modal component
â”‚   â”‚   â”‚       â”œâ”€â”€ FieldControls.tsx    # Dynamic field inputs
â”‚   â”‚   â”‚       â”œâ”€â”€ LinkEditor.tsx       # Entity relationship linking
â”‚   â”‚   â”‚       â”œâ”€â”€ StepChooseTemplate.tsx # Template selection
â”‚   â”‚   â”‚       â””â”€â”€ StepFillForm.tsx     # Field completion
â”‚   â”‚   â”œâ”€â”€ folders/            # Folder management components
â”‚   â”‚   â”‚   â”œâ”€â”€ FolderCard.tsx  # Folder display card
â”‚   â”‚   â”‚   â””â”€â”€ FolderGrid.tsx  # Folder grid layout
â”‚   â”‚   â”œâ”€â”€ templates/          # Template management components
â”‚   â”‚   â”‚   â”œâ”€â”€ TemplateCard.tsx # Template display card
â”‚   â”‚   â”‚   â”œâ”€â”€ TemplateEditor.tsx # Template editing interface
â”‚   â”‚   â”‚   â””â”€â”€ TemplateGrid.tsx # Template grid layout
â”‚   â”‚   â”œâ”€â”€ worlds/             # World management components
â”‚   â”‚   â”‚   â”œâ”€â”€ CreateWorldModal.tsx # 15-field world creation
â”‚   â”‚   â”‚   â”œâ”€â”€ NewWorldModal.tsx    # Simple world creation
â”‚   â”‚   â”‚   â”œâ”€â”€ WorldCard.tsx        # World display card
â”‚   â”‚   â”‚   â”œâ”€â”€ WorldEditModal.tsx   # World editing interface
â”‚   â”‚   â”‚   â””â”€â”€ WorldGrid.tsx        # World grid layout
â”‚   â”‚   â”œâ”€â”€ relationships/      # Relationship visualization
â”‚   â”‚   â”‚   â”œâ”€â”€ CreateRelationshipModal.tsx # Relationship creation
â”‚   â”‚   â”‚   â”œâ”€â”€ RelationshipGraph.tsx       # Visual mapping
â”‚   â”‚   â”‚   â””â”€â”€ RelationshipTable.tsx       # Tabular view
â”‚   â”‚   â””â”€â”€ header/             # Application header
â”‚   â”‚       â””â”€â”€ AppHeader.tsx   # Main application header
â”‚   â””â”€â”€ lib/                    # Utilities and configuration
â”‚       â”œâ”€â”€ types.ts           # TypeScript type definitions
â”‚       â”œâ”€â”€ store.ts           # Zustand async state management
â”‚       â”œâ”€â”€ mockData.ts        # Development seed data
â”‚       â”œâ”€â”€ formSchemas.ts     # Form validation schemas
â”‚       â”œâ”€â”€ coreTemplates.ts   # Core template definitions
â”‚       â”œâ”€â”€ utils.ts           # Utility functions
â”‚       â”œâ”€â”€ database/          # Database layer
â”‚       â”‚   â””â”€â”€ local.ts       # PostgreSQL database service
â”‚       â””â”€â”€ services/          # Service adapters
â”‚           â””â”€â”€ worldService.ts # World operations adapter
â”œâ”€â”€ scripts/                   # Development scripts
â”‚   â”œâ”€â”€ test-local-db.js      # Database connection test
â”‚   â””â”€â”€ test-database-service.ts # Service layer test
â”œâ”€â”€ public/                    # Static assets
â”‚   â”œâ”€â”€ file.svg              # File icon
â”‚   â”œâ”€â”€ globe.svg             # Globe icon
â”‚   â”œâ”€â”€ next.svg              # Next.js logo
â”‚   â”œâ”€â”€ vercel.svg            # Vercel logo
â”‚   â””â”€â”€ window.svg            # Window icon
â”œâ”€â”€ local_database_schema.sql  # Complete PostgreSQL schema
â”œâ”€â”€ fix_templates.sql         # Template installation script
â”œâ”€â”€ .env.local                # Local environment variables
â”œâ”€â”€ .env.local.example        # Environment template
â”œâ”€â”€ package.json               # Dependencies and scripts
â”œâ”€â”€ tailwind.config.ts         # Tailwind CSS configuration
â”œâ”€â”€ postcss.config.js          # PostCSS configuration
â”œâ”€â”€ postcss.config.mjs         # PostCSS ES module config
â”œâ”€â”€ next.config.ts             # Next.js configuration
â”œâ”€â”€ next-env.d.ts              # Next.js TypeScript definitions
â”œâ”€â”€ tsconfig.json              # TypeScript configuration
â”œâ”€â”€ eslint.config.mjs          # ESLint configuration
â”œâ”€â”€ README.md                  # Project documentation
â”œâ”€â”€ DEVELOPMENT.md             # Development documentation
â””â”€â”€ GEMINI.md                  # Additional documentation
```

## ðŸŽ¯ Core Data Models

### World
```typescript
type World = {
  id: string;
  name: string;
  summary?: string;
  entityCount: number;
  updatedAt: string;
  imageUrl?: string;
};
```

### Entity
```typescript
type Entity = {
  id: string;
  worldId: string;
  folderId?: string;
  templateId: string;
  name: string;
  summary?: string;
  fields: Record<string, unknown>;
  links: Link[];
  updatedAt: string;
};
```

### Template
```typescript
type Template = {
  id: string;
  worldId: string;
  name: string;
  folderId?: string;
  fields: TemplateField[];
};
```

### Folder
```typescript
type Folder = {
  id: string;
  worldId: string;
  name: string;
  description?: string;
  kind: 'entities' | 'templates';
  color?: string;
  count: number;
};
```

## Authentication System

### Complete Supabase Auth Integration
- **User Registration & Login** - Complete authentication flows with validation
- **Protected Routes** - Middleware-based authentication for Next.js 15
- **User Profiles** - Profile management with display names and settings
- **Session Management** - Persistent authentication state across page reloads
- **Auth Context** - React context provider for authentication state
- **Protected API** - Server-side authentication verification on all endpoints

### Authentication Components
- **Login Page** (`/src/app/login/page.tsx`) - Email/password login with validation
- **Register Page** (`/src/app/register/page.tsx`) - User registration with confirmation
- **Profile Page** (`/src/app/profile/page.tsx`) - Profile management interface
- **Auth Context** (`/src/contexts/AuthContext.tsx`) - Global authentication state
- **Middleware** (`/middleware.ts`) - Route protection and session management
- **App Header** (`/src/components/header/AppHeader.tsx`) - User status and logout
### Current Auth Status
- ? **User Registration** - Functional with email verification
- ? **User Login** - Works with session persistence
- ? **Protected API Routes** - All `/api/worlds` endpoints require authentication
- ? **User Context** - Authentication state available throughout app
- ? **Profile Management** - Users can update display names and preferences
- ? **Unauthenticated** - Protected routes return 401 (no mock fallback)
- ? **Store Integration** - World operations use authenticated user's ID

## Data Integration Status

### Fully Integrated with Supabase
- **Authentication** - Complete Supabase Auth system with protected routes
- **Worlds** - Full CRUD operations with user-scoped access via RLS policies
- **User Profiles** - Profile creation and management connected to auth users

### Fully Integrated (API + RLS)
- Templates, Entities, Folders, and Relationships are API-backed and RLS-protected.

### Integration Architecture
- **API-First Approach** - All database operations go through protected API routes
- **Authenticated Sessions** - User ID automatically retrieved from Supabase session
- **RLS Security** - Row Level Security ensures users only see their own data
- Unauthenticated — protected routes return 401 (no mock fallback)
- **Type Safety** - Auto-generated TypeScript types from live database schema

### Prerequisites
- Node.js 20+ 
- npm 9+
- Supabase account (project: `rkjtxcavocbhhwuywduj`)
- Modern browser with ES2022 support

### Installation
```bash
cd worldweaver-ui
npm install
```

### Environment Setup
Create `.env.local` with Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://rkjtxcavocbhhwuywduj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Development Server
```bash
npm run dev
```
Application runs on `http://localhost:3000`

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run Vitest tests

### Authentication Testing
```bash
# 1. Start development server
npm run dev

# 2. Register a new user
# Navigate to http://localhost:3000/register

# 3. Login with your account
# Navigate to http://localhost:3000/login

## Recent Updates (Supabase + API)

### Supabase migrations
- Added: invitations, activity logs, and world files with RLS and indexes.
  - File: `supabase/migrations/20250907020000_add_invites_activity_files.sql`
- Includes RPC: `accept_world_invite(invite_token text)` (SECURITY DEFINER) to accept invites.

How to apply:
- Paste the migration SQL into Supabase SQL Editor and run. Policies are created without IF NOT EXISTS (will fail if policy already exists).

### System template seeding
- HTTP seeder (via Next API):
  - Requirements in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SEED_ADMIN_TOKEN`.
  - Run dev server: `npm run dev`
  - Seed: `npm run seed:core`
  - Endpoint: `POST /api/admin/seed-core-templates?token=SEED_ADMIN_TOKEN`
- Direct local Postgres seeder (bypasses HTTP/Supabase):
  - Script: `scripts/seed-core-templates-local.js`
  - Env: `DATABASE_URL=postgresql://...`
  - Run: `node scripts/seed-core-templates-local.js`

### New API routes
- Worlds (REST):
  - `GET /api/worlds/[id]` â€“ fetch a world if user has access
  - `PUT /api/worlds/[id]` â€“ update (owner only); body: `{ name, description, isPublic, isArchived }`
  - `DELETE /api/worlds/[id]` â€“ delete (owner only)
- Invites:
  - `POST /api/worlds/[id]/invites` â€“ create invite (owner/admin). Body: `{ email, role: 'viewer'|'editor'|'admin', expiresInDays }`
  - `POST /api/invites/accept` â€“ accept invite. Body: `{ token }`
  - Page: `/invite/accept?token=...` â€“ simple client page to accept via link (user must be logged in with invited email).

### Supabase types
- App now uses `src/lib/supabase/types.generated.ts` as the type source.
- To regenerate from Supabase Dashboard: API â†’ Types â†’ copy TS â†’ replace file contents.
- Optional Supabase CLI example:
  - `SUPABASE_ACCESS_TOKEN=... npx supabase gen types typescript --project-id <project-ref> --schema public > src/lib/supabase/types.generated.ts`

### Endpoint test script (auth-aware)
- Script: `scripts/test-api-endpoints.js`
- Set in `.env.local`:
  - `TEST_EMAIL=you@example.com`
  - `TEST_PASSWORD=your-password`
  - `TEST_INVITE_EMAIL=invitee@example.com` (optional)
- Run: `node scripts/test-api-endpoints.js`
- What it does: lists worlds, creates/reads/updates/deletes a world, and exercises invite creation.


# 4. Test authenticated world operations
# Create/edit/delete worlds as authenticated user
```

## ðŸŽ¨ UI Component Library

### Base Components (`/src/components/ui/`)
- **Button** (`Button.tsx`) - Primary action button with variants
- **Card** (`Card.tsx`) - Container component for content sections
- **Input** (`Input.tsx`) - Form input with validation states
- **Select** (`Select.tsx`) - Dropdown selection component
- **Textarea** (`Textarea.tsx`) - Multi-line text input component
- **Toggle** (`Toggle.tsx`) - Toggle switch component (uses `pressed` prop)
- **Tabs** (`Tabs.tsx`) - Tabbed interface (uses `activeKey/onChange` props)
- **Modal** (`Modal.tsx`) - Overlay modal for dialogs
- **Spinner** (`Spinner.tsx`) - Loading indicator
- **EmptyState** (`EmptyState.tsx`) - Empty state placeholder
- **CommandPalette** (`CommandPalette.tsx`) - Quick action interface
- **Kbd** (`Kbd.tsx`) - Keyboard shortcut display

### Feature Components
- **WorldCard** (`/src/components/worlds/WorldCard.tsx`) - Enhanced world display with floating animations
- **EntityCard** (`/src/components/entities/EntityCard.tsx`) - Entity display with hover effects
- **TemplateCard** (`/src/components/templates/TemplateCard.tsx`) - Template display with selection states
- **FolderCard** (`/src/components/folders/FolderCard.tsx`) - Folder display with consistent styling
- **CreateEntityModal** (`/src/components/entities/CreateEntityModal/`) - Multi-step entity creation
- **CreateFolderModal** (`/src/components/folders/CreateFolderModal.tsx`) - Folder creation with color selection
- **CreateTemplateModal** (`/src/components/templates/CreateTemplateModal.tsx`) - Template creation with field management
- **CreateWorldModal** (`/src/components/worlds/CreateWorldModal.tsx`) - Comprehensive 15-field world creation wizard
- **WorldEditModal** (`/src/components/worlds/WorldEditModal.tsx`) - Complete world editing interface with 15-field form and step navigation
- **NewWorldModal** (`/src/components/worlds/NewWorldModal.tsx`) - Simple world creation interface
- **CreateRelationshipModal** (`/src/components/relationships/CreateRelationshipModal.tsx`) - Relationship creation with notes and preview
- **EntityDetailModal** (`/src/components/entities/EntityDetailModal.tsx`) - Comprehensive entity viewing and editing interface
- **TemplateEditor** (`/src/components/templates/TemplateEditor.tsx`) - Comprehensive template editing interface
- **RelationshipGraph** (`/src/components/relationships/RelationshipGraph.tsx`) - Visual relationship mapping
- **RelationshipTable** (`/src/components/relationships/RelationshipTable.tsx`) - Tabular relationship view
- **WorldGrid** (`/src/components/worlds/WorldGrid.tsx`) - Grid layout for world cards
- **EntityGrid** (`/src/components/entities/EntityGrid.tsx`) - Grid layout for entity cards
- **TemplateGrid** (`/src/components/templates/TemplateGrid.tsx`) - Grid layout for template cards
- **FolderGrid** (`/src/components/folders/FolderGrid.tsx`) - Grid layout for folder cards

## ðŸŒŸ Key Features Implemented

### 1. Complete Supabase Authentication âœ…
- **User Registration & Login** - Full authentication flows with Supabase Auth
- **Protected API Routes** - Server-side authentication verification on all endpoints
- **User Profile Management** - Profile creation, editing, and display name management
- **Authentication Context** - React context provider for global auth state
- **Session Persistence** - Automatic session management across page reloads
- **Middleware Protection** - Next.js middleware for route-based authentication
- Unauthenticated â€” protected routes return 401 (no mock fallback)

### 2. Production Database Integration âœ…
- **Supabase Production Database** - Cloud-hosted PostgreSQL with complete schema
- **Row Level Security** - User-scoped data access with RLS policies on all tables
- **Auto-Generated Types** - TypeScript types generated from live database schema
- **Protected World Operations** - Full CRUD operations for authenticated users only
- **Database Service Layer** - Clean abstraction for Supabase operations

### 3. Authenticated Store Architecture âœ…
- **Zustand Store with Authentication** - State management using authenticated user context
- **API Integration** - Store methods call protected API endpoints
- **Automatic User Context** - User ID retrieved from authenticated sessions
- **Error Handling & Loading States** - User-friendly feedback for async operations
- Unauthenticated â€” protected routes return 401 (no mock fallback)
- **Type-Safe Operations** - TypeScript support throughout store operations

### 4. Enhanced Creation Button Hover Effects âœ…
- **Unified Design Language** - All creation buttons share consistent interactive patterns
- **Color-Coded Actions** - Each creation type has distinctive gradients:
  - ðŸŒ **New World** - Blue/purple gradient (world-level actions)
  - ðŸ‘¥ **Create Entity** - Green/blue gradient (entity-level actions)
  - ðŸ“‹ **Create Template** - Amber/orange gradient (template-level actions)
  - ðŸ”— **Create Relationship** - Purple/pink gradient (relationship-level actions)
- **Premium Animations** - Scale transforms, elevation effects, rotating icons, gradient overlays
- **Enhanced Shadows** - Color-matched glows (blue, green, amber, purple shadows)
- **Smooth Transitions** - 300ms coordinated animations across all elements

### 5. Enhanced Card Hover Effects
- Consistent hover animations across all card components
- Blue hover effects for entities, amber for templates
- Smooth transitions with transform and color changes

### 6. World Cards with Premium Animations
- Floating particle effects with geometric patterns
- Dynamic hover states with depth and movement
- Visual hierarchy with gradient overlays

### 7. Comprehensive Settings Page
- 5 tabbed sections: General, Appearance, Data & Storage, Privacy, Notifications
- Proper TypeScript interfaces for all components
- Form state management with validation

### 8. Entity & Template Creation
- **CreateEntityModal** (`/src/components/entities/CreateEntityModal/CreateEntityModal.tsx`) - Multi-step creation workflows
- **StepChooseTemplate** (`/src/components/entities/CreateEntityModal/StepChooseTemplate.tsx`) - Template selection step
- **StepFillForm** (`/src/components/entities/CreateEntityModal/StepFillForm.tsx`) - Field completion step
- **FieldControls** (`/src/components/entities/CreateEntityModal/FieldControls.tsx`) - Dynamic field input controls
- **LinkEditor** (`/src/components/entities/CreateEntityModal/LinkEditor.tsx`) - Entity relationship linking
- Dynamic field management for templates
- Folder assignment and organization
- Form validation with user feedback

### 9. Comprehensive World Creation
- **15-field detailed world creation form** with 3-step wizard:
  - **Step 1 - Core Information:** Name, logline, genre blend, tone, themes
  - **Step 2 - World Parameters:** Audience rating, scope/scale, technology/magic levels, cosmology, climate/biomes
  - **Step 3 - World Details:** Calendar/timekeeping, societal overview, conflict drivers, rules/constraints, aesthetic direction
- Multi-select field controls with visual tags
- Form validation and error handling
- Progress indicator and step navigation
- Comprehensive dropdown options for all world-building aspects

### 10. Relationship Management System
- **Create New Relationship Button** - Purple/pink themed creation button on Relationships tab
- **CreateRelationshipModal** (`/src/components/relationships/CreateRelationshipModal.tsx`) - Comprehensive relationship creation interface:
  - Entity selection dropdowns (From/To entities)
  - Relationship type input with examples
  - **Notes section** - Optional textarea for additional context and details
  - Real-time relationship preview in natural language
  - Form validation preventing self-relationships
  - Professional error handling and user feedback
- **Enhanced EmptyState** (`/src/components/ui/EmptyState.tsx`) - Creation buttons in empty states with matching hover effects
- **Store Integration** (`/src/lib/store.ts`) - Proper Zustand state management for relationship creation

### 11. Core Template System
- **Core Templates** (`/src/lib/coreTemplates.ts`) - Centralized template definitions
- **Comprehensive Character Template** - 15-field character creation with:
  - Character Name, One-Line Concept, Role/Archetype, Pronouns & Form of Address
  - Species/Origin, Age & Appearance, Distinctive Features (tags), Personality Traits (tags)
  - Values & Beliefs, Motivations & Goals, Flaws & Vulnerabilities
  - Skills & Competencies (tags), Resources & Assets, Relationships Overview, Secrets & GM Notes
- **Comprehensive Location Template** - 15-field location creation with:
  - Location Name, One-Line Description, Category/Type, Setting Context (tags)
  - Climate & Biome (tags), Population/Usage Feel, Atmosphere & Mood (tags)
  - Safety Level, Law & Order Presence, Hazards & Risks (tags)
  - Access & Travel, Resources & Economy, Services & Amenities (tags)
  - Points of Interest, Secrets & GM Notes
- **Comprehensive Object Template** - 15-field object creation with:
  - Object Name, One-Line Description, Category/Type, Size & Portability
  - Materials & Construction (tags), Craftsmanship/Quality, Condition
  - Era/Origin, Primary Functions (tags), Distinctive Features (tags)
  - Operation/Usage Procedure, Capabilities & Limits, Power Source
  - Value & Rarity, Secrets & GM Notes
- **Comprehensive Organization Template** - 15-field organization creation with:
  - Organization Name, One-Line Summary, Organization Type, Purpose/Mandate
  - Scope & Reach, Governance Model, Transparency/Secrecy Level
  - Operating Methods (tags), Legal Status/Legitimacy, Spheres of Influence (tags)
  - Resources & Assets, Membership Profile & Requirements, Culture & Practices
  - Risk Posture, Secrets & GM Notes
- **Comprehensive Culture Template** - 15-field culture creation with:
  - Culture Name, One-Line Identity, Core Values & Virtues (tags), Social Structure
  - Family & Kinship Pattern, Role Expectations & Labor Division, Customs & Taboos
  - Etiquette & Social Norms (tags), Belief Orientation, Economy & Livelihoods
  - Attitude to Technology/Magic, Arts & Aesthetic Motifs, Justice & Conflict Resolution
  - Festivals & Rites of Passage, Contradictions & Fault Lines (GM Notes)
- **Comprehensive Species Template** - 15-field species creation with:
  - Species Name, One-Line Identity, Morphology Archetype, Typical Size & Build
  - Physiology Highlights (tags), Life Cycle & Lifespan, Reproduction & Parenting
  - Senses & Perception, Preferred Habitats & Range (tags), Diet & Metabolism
  - Cognition & Intelligence Tier, Communication Modes, Temperament & Social Behavior
  - Adaptations & Vulnerabilities, Ecological Niche & Impact
- **Comprehensive Religion/Philosophy Template** - 15-field religious/philosophical tradition creation with:
  - Tradition Name, One-Line Identity, Tradition Type, Core Tenets
  - Cosmology & Origins, Deity/Force Model, Sacred Sources (tags), Rites & Practices
  - Moral Framework & Virtues, Prohibitions & Taboos, Organization & Clergy
  - Symbols & Aesthetic Motifs, Observances & Calendar, Stance Toward Others, Secrets & GM Notes
- **Comprehensive Government & Law Template** - 15-field governmental system creation with:
  - Government Name, One-Line Identity, Governance Type, Jurisdiction Level
  - Legitimacy Source, Branches/Power Distribution (tags), Legal System Type, Lawmaking Process
  - Rights & Protections, Duties & Obligations, Enforcement & Policing
  - Courts & Due Process, Punishments & Sanctions, Integrity & Corruption Level, Emergency Powers & Security
- **Comprehensive Power System Template** - 15-field power/magic system creation with:
  - Power System Name, One-Line Identity, Source Type, Access Requirements
  - Interface/Method (tags), Domains of Effect (tags), Range & Scale, Costs & Fuel
  - Risks & Side Effects, Rules & Constraints, Stability & Predictability
  - Countermeasures & Resistance, Legality & Social Standing, Typical Practitioners, Signatures & Aesthetics
- **Comprehensive Economy & Trade Template** - 15-field economic system creation with:
  - Economy Name, One-Line Identity, Currency Model, Primary Resources & Goods (tags)
  - Scarcity & Abundance, Key Sectors & Industries (tags), Production Methods, Labor Market & Class Dynamics
  - Impact of Tech/Magic, Trade Routes & Logistics, Markets & Hubs
  - Regulation/Tariffs & Taxes, Finance & Credit System, Risks & Disruptions, Secrets & GM Notes
- **Comprehensive Creature (Fauna) Template** - 15-field creature/wildlife creation with:
  - Creature Name, One-Line Description, Creature Type/Classification, Size & Build
  - Habitat & Biome (tags), Activity Cycle, Temperament, Social Structure
  - Diet & Feeding Behavior, Senses & Perception, Movement & Locomotion (tags)
  - Adaptations (Physical/Behavioral), Defenses & Hazards, Reproduction & Life Cycle, Ecological Role & Interactions
- **Comprehensive Plant/Fungi Template** - 15-field flora/fungi creation with:
  - Species/Common Name, One-Line Description, Classification Type, Growth Form/Morphology
  - Habitat/Biome & Climate (tags), Substrate/Soil Preferences (tags), Phenology (Seasonality), Reproduction & Propagation
  - Distinctive Field Features (tags), Edibility & Culinary Use, Medicinal/Alchemical Properties
  - Hazards & Toxicity, Ecological Role & Interactions, Distribution & Range, Human/Industry Uses
- **Comprehensive Material/Resource Template** - 15-field material/resource creation with:
  - Material/Resource Name, One-Line Description, Category/Type, Physical State
  - Appearance & Identifiers (tags), Core Properties (Mech/Therm/Elec/Chem), Grade & Purity, Occurrence & Formation
  - Extraction/Harvest Methods, Refinement & Processing, Forms & Standard Units (tags), Applications & Use Cases
  - Availability & Rarity, Hazards/Safety & Handling, Storage/Transport & Stability
- **Comprehensive Monster Template** - 15-field monster/threat creation with:
  - Monster Name, One-Line Description, Origin Type, Classification
  - Threat Level, Size & Silhouette, Habitat & Domain (tags), Activity Cycle
  - Cognition Tier, Behavior & Temperament, Signs/Omens & Foreshadowing, Tactics & Preferred Engagements
  - Abilities & Special Traits, Defenses/Resistances & Weaknesses, Lair Features & Encounter Hooks
- **Comprehensive Magic Item Template** - 15-field magical item creation with:
  - Item Name, One-Line Description, Item Category/Type, Power Source & Attunement
  - Activation Method(s) (tags), Core Effects/Domains (tags), Capabilities & Limits, Energy/Charges & Recharge
  - Costs & Requirements, Risks & Side Effects, Use Conditions & Rules, Resonance & Interactions
  - Appearance & Signatures, Ownership/Binding & Transfer, Legality & Social Standing
- **Comprehensive Event Template** - 15-field event/incident creation with:
  - Event Name, One-Line Summary, Event Type, Timeframe & Duration
  - Location Context, Risk/Intensity Level, Triggers & Root Causes, Goals & Stakes
  - Participants (Roles Only), Phases/Timeline Beats, Key Actions & Turning Points, Constraints & Conditions
  - Outcomes & Consequences, Public Narrative & Perception, Secrets & GM Notes
- **Comprehensive Recipe Template** - 15-field recipe/formula creation with:
  - Recipe Name, One-Line Purpose, Recipe Domain, Category/Type
  - Complexity Level, Yield & Units, Inputs/Ingredients, Tools/Equipment/Stations (tags)
  - Preconditions & Environment, Procedure/Steps, Timing & Schedule, Safety & Hazards
  - Quality Criteria & Tests, Variations/Substitutions & Scaling, Storage/Packaging & Shelf Life
- **Comprehensive Illness Template** - 15-field medical/disease creation with:
  - Illness Name, One-Line Description, Etiology Type, Vector/Transmission Modes (tags)
  - Incubation & Onset, Symptoms & Signs, Clinical Severity, Progression & Stages
  - Contagious Period & Shedding, Transmissibility Level, Diagnosis & Detection, Countermeasures
  - Complications & Sequelae, Vulnerable Populations & Risk Factors, Public Health Measures & Containment
- **Automatic Template Creation** - Core templates automatically added to all new worlds
- **Extensive Field Options** - Comprehensive dropdown and tag options for world-building

### 12. Entity Detail Modal System
- **EntityDetailModal** (`/src/components/entities/EntityDetailModal.tsx`) - Comprehensive entity viewing and editing interface:
  - Full entity information display with template-based field rendering
  - Edit mode with form validation and error handling
  - Template field support for all field types (shortText, longText, select, multiSelect)
  - Relationship display and management (view/remove entity links)
  - Folder assignment with world-scoped folder selection
  - Professional modal interface with proper TypeScript integration
- **Enhanced EntityCard** (`/src/components/entities/EntityCard.tsx`) - Click-to-open functionality for entity details
- **EntityGrid Integration** (`/src/components/entities/EntityGrid.tsx`) - Modal state management and entity selection
- **Zustand Store** (`/src/lib/store.ts`) with proper TypeScript types
- **Mock Data** (`/src/lib/mockData.ts`) - Automatic count updates for folders and worlds
- Optimistic updates for better UX
- Seed data for development

### 13. World Editing System
- **WorldEditModal** (`/src/components/worlds/WorldEditModal.tsx`) - Comprehensive world editing interface with 3-step wizard:
  - **Step 1 - Core Information:** Edit name, logline, genre blend, tone, themes
  - **Step 2 - World Parameters:** Update audience rating, scope/scale, technology/magic levels, cosmology, climate/biomes
  - **Step 3 - World Details:** Modify calendar/timekeeping, societal overview, conflict drivers, rules/constraints, aesthetic direction
- **Multi-select Field Support** - Tag-based input for genres, themes, tones, and climate types
- **Form Validation** - Proper validation with required field checking
- **Progress Navigation** - Step-by-step navigation with visual progress indicators
- **Dashboard Integration** (`/src/app/page.tsx`) - Edit buttons on world cards trigger the edit modal
- **Store Integration** (`/src/lib/store.ts`) - Proper Zustand state management for world updates
- **Consistent UI** - Matches CreateWorldModal design patterns and styling

### 14. Template Editing System
- **TemplateDetailModal** (`/src/components/templates/TemplateDetailModal.tsx`) - Template viewing interface with edit mode toggle:
  - Click template cards to view template details
  - Clear field breakdown with type indicators and options preview
  - Visual indicators for core templates vs custom templates
  - "Edit Template" button to enter edit mode
  - Delete functionality for custom templates with confirmation
- **Comprehensive Template Editor** (`/src/components/templates/TemplateEditor.tsx`) - Full template editing interface with modal support:
  - Template name editing with validation
  - Dynamic field management (add, remove, reorder fields)
  - Field property editing (name, type, required status, help text)
  - Support for all field types (shortText, longText, number, select, multiSelect)
  - Option management for select/multiSelect fields
  - Form validation with error handling
  - Professional modal interface with proper TypeScript integration
- **Enhanced TemplateCard** (`/src/components/templates/TemplateCard.tsx`) - Clean clickable interface:
  - Click entire card to view template details
  - Removed extra buttons for cleaner interface
  - Visual indicators for core templates and field counts
  - Hover effects with click hints
- **Core Template Customization** - Core templates can be edited per-world without affecting other worlds
- **Template Deletion** - Custom templates can be deleted with confirmation dialogs
- **Store Integration** (`/src/lib/store.ts`) - Proper Zustand state management for template CRUD operations
- **Automatic Folder Count Updates** - Template counts update automatically when templates are deleted

### 15. World Membership System
- **MembershipTab Component** (`/src/components/membership/MembershipTab.tsx`) - Comprehensive collaboration interface:
  - **Members Section** - Professional member table with avatars, roles, join dates, last activity
  - **Role Management** - Dropdown role changes for Admin/Editor/Viewer, Owner crown indicators
  - **Member Actions** - Transfer ownership and member removal with confirmation
  - **Invites Section** - Pending invitation management with send/revoke functionality
  - **Settings Section** - Seat limits, invite link configuration, expiration controls
- **Enhanced World Page** (`/src/app/world/[id]/page.tsx`) - Members tab integration with count badges
- **Store Integration** (`/src/lib/store.ts`) - Complete membership CRUD operations:
  - `getWorldMembers()` / `getWorldInvites()` - Member and invite retrieval
  - `inviteMember()` / `updateMemberRole()` / `removeMember()` - Member management
  - `revokeInvite()` / `updateWorldSettings()` / `transferOwnership()` - Advanced operations
- **Mock Data** (`/src/lib/mockData.ts`) - Sample members and invites for development
- **Permission System** - Owner/Admin/Editor/Viewer roles with granular permission matrix
- **Professional UI Design** - Enhanced tables, modals, and interactive elements with proper dark mode support

## âš ï¸ Known Issues & Technical Debt

### Current Status âœ…
- **Complete Authentication Integration** - Supabase Auth fully operational with protected routes
- **Production Database Connected** - All world operations use authenticated database access
- **Clean Store Architecture** - Store methods properly use authenticated user context
- **Type Safety** - Auto-generated types from live database schema

### Partial Integration Status
- **Worlds**: âœ… Fully integrated with Supabase
- **Authentication**: âœ… Complete Supabase Auth integration  
- **Templates**: âš ï¸ System templates loaded, custom templates still use mock data
- **Entities**: âš ï¸ Still using mock data, needs API routes and database integration
- **Folders**: âš ï¸ Still using mock data, needs API routes and database integration
- **Relationships**: âš ï¸ Still using mock data, needs API routes and database integration

### Next Steps for Complete Integration
1. **Create Entity API Routes** - `/api/entities` following same pattern as worlds
2. **Create Template API Routes** - `/api/templates` for custom template operations
3. **Create Folder API Routes** - `/api/folders` for organization structure
4. **Create Relationship API Routes** - `/api/relationships` for entity connections
5. **Update Store Methods** - Connect remaining operations to authenticated API routes

### Areas for Improvement
1. **Complete Entity Integration** - Create API routes and connect entities to Supabase
2. **Template Management** - Implement custom template CRUD operations with database
3. **Folder System** - Connect folder organization to Supabase
4. **Relationship System** - Implement relationship mapping with database persistence
5. **Performance Optimization** - Implement caching and query optimization

## ðŸš§ Development Priorities

### Immediate (Next Steps)
1. **Complete Entity Integration** - Create `/api/entities` routes with Supabase integration
2. **Template API Development** - Implement `/api/templates` for custom template operations  
3. **Folder Management** - Create `/api/folders` for organization structure
4. **Relationship Persistence** - Implement `/api/relationships` with database storage
5. **Store Migration** - Update remaining store methods to use authenticated API routes

### Short Term (1-2 Weeks)
1. **Complete API Migration** - Move all CRUD operations to authenticated API routes
2. **Enhanced Error Handling** - Add comprehensive error boundaries
3. **Form Validation** - Enhance client-side validation across all forms
4. **Search & Filtering** - Implement comprehensive search across all entities
5. **Performance Optimization** - Add query optimization and caching

### Medium Term (1 Month)
1. **Bulk Operations** - Multi-select and bulk actions for entities
2. **Import/Export** - Data backup and migration tools
3. **Real-time Features** - Live updates for collaborative editing
4. **Mobile Responsiveness** - Optimize interface for mobile devices
5. **Advanced Permissions** - Granular role-based access control

### Long Term (3+ Months)
1. **Advanced Visualization** - Enhanced relationship graphs and data visualization
2. **AI Integration** - Content generation and world-building assistance
3. **Plugin System** - Extensible architecture for custom functionality
4. **Advanced Analytics** - Usage metrics and world-building insights
5. **Enterprise Features** - Team management and advanced collaboration tools

## ðŸ“‹ API Development Workflow

### Step-by-Step Database Integration
```bash
# 1. Start development server
cd "d:\World Deck\worldweaver-ui"
npm run dev

# 2. Test API endpoints with mock data
curl http://localhost:3000/api/worlds?userId=550e8400-e29b-41d4-a716-446655440000

# 3. Enable database operations (when ready)
# Edit /src/app/api/worlds/route.ts
# Set USE_DATABASE = true

# 4. Test database integration
node scripts/test-local-db.js
```

### API Endpoint Testing
```bash
# Test GET all worlds
curl "http://localhost:3000/api/worlds?userId=550e8400-e29b-41d4-a716-446655440000"

# Test GET single world
curl "http://localhost:3000/api/worlds/world-1"

# Test POST new world
curl -X POST "http://localhost:3000/api/worlds" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test World","description":"Test Description","userId":"550e8400-e29b-41d4-a716-446655440000"}'

# Test PUT update world
curl -X PUT "http://localhost:3000/api/worlds/world-1" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name","userId":"550e8400-e29b-41d4-a716-446655440000"}'

# Test DELETE world
curl -X DELETE "http://localhost:3000/api/worlds/world-1"
```

### Database Development
```bash
# Daily Development
cd "d:\World Deck\worldweaver-ui"
npm run dev

# Test database connection
node scripts/test-local-db.js

# Connect to database for debugging
psql -U worldweaver_user -d worldweaver_dev -h localhost
```

### Database Management
```bash
# Backup database
pg_dump worldweaver_dev > backup.sql

# Reset database (careful!)
psql -U postgres -c "DROP DATABASE worldweaver_dev;"
psql -U postgres -c "CREATE DATABASE worldweaver_dev;"
psql -U worldweaver_user -d worldweaver_dev -f local_database_schema.sql
psql -U worldweaver_user -d worldweaver_dev -f fix_templates.sql
```

### Migration to Production
```bash
# Export local schema
pg_dump -s worldweaver_dev > production_schema.sql

# Export data
pg_dump --data-only worldweaver_dev > production_data.sql

# Deploy to Supabase using DATABASE_SCHEMA.md
```

## ðŸ“‹ Component Interface Reference

### Critical Interface Notes
Always use these exact prop names to maintain TypeScript compliance:

```typescript
// Card component - only accepts HTML div attributes
<Card>
  <h3>Title</h3>
  <p>Description</p>
  {/* Content */}
</Card>

// Toggle component - uses 'pressed' not 'checked'
<Toggle
  pressed={boolean}
  onClick={() => handleToggle()}
/>

// Tabs component - uses 'activeKey' and 'onChange'
<Tabs
  tabs={TabItem[]}
  activeKey={string}
  onChange={(key) => setActiveKey(key)}
/>
```

## ðŸ” Debugging & Development Tips

### Common Issues
1. **TypeScript Errors** - Always check component interfaces before using props
2. **State Updates** - Use Zustand actions for all state modifications
3. **Styling Issues** - Check Tailwind class conflicts and specificity
4. **Performance** - Use React.memo for expensive components

### Development Workflow
1. Start with component interface validation
2. Implement TypeScript types first
3. Add to Zustand store if state is needed
4. Create UI components with proper prop types
5. Test with mock data before real implementation

## ðŸ“ž Support & Resources

### Key Files for Reference
- **`/src/app/api/worlds/route.ts`** - Authenticated worlds API endpoint (GET all, POST new)
- **`/src/app/api/worlds/[id]/route.ts`** - Individual world operations (GET, PUT, DELETE) with auth
- **`/src/contexts/AuthContext.tsx`** - Complete authentication context provider
- **`/src/lib/supabase/browser.ts`** - Supabase client configuration
- **`/src/lib/services/supabaseWorldService.ts`** - Database operations using Supabase
- **`/src/lib/store.ts`** - Authenticated Zustand store with API integration
- **`/middleware.ts`** - Authentication middleware for route protection
- **`/src/lib/supabase/database.types.ts`** - Auto-generated TypeScript types
- `/src/lib/types.ts` - Application TypeScript definitions and interfaces
- `/.env.local` - Environment variables for Supabase configuration

### Development Environment
- **IDE:** VS Code recommended with TypeScript and Tailwind extensions
- **Database:** Supabase Dashboard for visual database management
- **Browser:** Chrome/Edge with React Developer Tools
- **Debugging:** React DevTools, Zustand DevTools, Supabase Dashboard

### Quick Reference
| Operation | Command/Action |
|-----------|----------------|
| **Start Dev Server** | `npm run dev` |
| **Test Authentication** | Register/Login at `http://localhost:3000` |
| **View Database** | Supabase Dashboard - Table Editor |
| **Check API Endpoints** | `curl http://localhost:3000/api/worlds` (requires auth) |
| **View Auth Users** | Supabase Dashboard - Authentication |
| **Monitor API Logs** | Supabase Dashboard - API Logs |
| **Update Database Types** | Generated automatically from schema |

---

**Note:** This documentation reflects the current state as of September 6, 2025, including the completed Supabase authentication integration with protected API routes. The application now has a fully functional authentication system with user-scoped data access and is ready for expanding the remaining entities to use the same authenticated database integration pattern.


