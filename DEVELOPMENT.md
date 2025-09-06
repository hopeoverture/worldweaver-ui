# WorldWeaver UI - Development Documentation

**Last Updated:** September 6, 2025  
**Version:** 0.1.0  
**Build Status:** Active Development  
**Latest Changes:** Local PostgreSQL database integration, database service layer, comprehensive local development environment setup

## 🚀 Project Overview

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

## 🛠️ Technology Stack

### Core Framework
- **Next.js 15.5.2** - React framework with App Router
- **React 19.1.0** - Latest React with modern hooks
- **TypeScript 5** - Full type safety throughout the application

### Database & Persistence
- **PostgreSQL 17.5** - Local development database with full SQL support
- **pg** - PostgreSQL driver for Node.js with TypeScript support
- **Custom Database Service** - Type-safe database abstraction layer

### Styling & UI
- **Tailwind CSS 4.1.13** - Utility-first CSS framework with modern features
- **PostCSS 8.5.6** - CSS processing with Tailwind integration
- **Custom Components** - Reusable UI component library

### 11. State Management
- **Zustand 5.0.8** - Lightweight state management for global app state

### Development Tools
- **ESLint 9** - Code linting with Next.js configuration
- **Vitest** - Testing framework (configured but not extensively used yet)

## 🗄️ Database Architecture

### Local PostgreSQL Setup
- **PostgreSQL 17.5** running locally on port 5432
- **worldweaver_dev** database with 11 core tables
- **worldweaver_user** with full database permissions
- **Test user:** `developer@worldweaver.com` for development

### Database Tables
1. **auth_users** - Local authentication (replaces Supabase auth)
2. **profiles** - User profile information
3. **worlds** - World/project containers
4. **world_members** - Collaboration and permissions
5. **world_invites** - Invitation system
6. **templates** - Entity templates (system & custom)
7. **folders** - Organization structure
8. **entities** - World-building content
9. **relationships** - Entity connections
10. **activity_logs** - Audit trail
11. **world_files** - File attachments

### Database Service Layer
```typescript
// src/lib/database/local.ts
export class LocalDatabaseService {
  // User operations
  async createUser(email: string, passwordHash?: string)
  async getUserByEmail(email: string)
  async getUserById(id: string)
  
  // Profile operations
  async getProfile(userId: string)
  async updateProfile(userId: string, data: any)
  
  // World operations
  async createWorld(name: string, description: string, ownerId: string)
  async getWorldsByUser(userId: string)
  async getWorldById(worldId: string, userId: string)
  
  // Template operations
  async getSystemTemplates()
  async getWorldTemplates(worldId: string)
  async getAllTemplates(worldId?: string)
  
  // Entity operations
  async createEntity(data: any)
  async getEntitiesByWorld(worldId: string)
  async getEntityById(entityId: string)
  
  // Utility operations
  async testConnection()
  async getStats()
}
```

### Connection Details
- **Database URL:** `postgresql://worldweaver_user:worldweaver2025!@localhost:5432/worldweaver_dev`
- **Environment:** Configured in `.env.local`
- **Testing:** `node scripts/test-local-db.js`

## 📁 Project Structure

```
worldweaver-ui/
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── page.tsx            # Dashboard/Home page
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── globals.css         # Global styles and Tailwind
│   │   ├── favicon.ico         # Application favicon
│   │   ├── settings/           # Settings page
│   │   │   └── page.tsx        # Settings implementation
│   │   ├── profile/            # Profile page
│   │   │   └── page.tsx        # User profile management
│   │   └── world/[id]/         # Dynamic world pages
│   │       └── page.tsx        # Individual world view
│   ├── components/             # Reusable React components
│   │   ├── ui/                 # Base UI components
│   │   │   ├── Button.tsx      # Primary action button
│   │   │   ├── Card.tsx        # Container component
│   │   │   ├── CommandPalette.tsx # Quick action interface
│   │   │   ├── EmptyState.tsx  # Empty state placeholder
│   │   │   ├── Input.tsx       # Form input component
│   │   │   ├── Kbd.tsx         # Keyboard shortcut display
│   │   │   ├── Modal.tsx       # Overlay modal dialog
│   │   │   ├── Select.tsx      # Dropdown selection
│   │   │   ├── Spinner.tsx     # Loading indicator
│   │   │   ├── Tabs.tsx        # Tabbed interface
│   │   │   ├── Textarea.tsx    # Multi-line text input
│   │   │   └── Toggle.tsx      # Toggle switch
│   │   ├── dashboard/          # Dashboard-specific components
│   │   │   ├── TabNav.tsx      # Dashboard navigation tabs
│   │   │   └── WorldContextBar.tsx # World context info
│   │   ├── entities/           # Entity management components
│   │   │   ├── EntityCard.tsx  # Entity display card
│   │   │   ├── EntityGrid.tsx  # Entity grid layout
│   │   │   ├── EntityDetailModal.tsx # Entity view/edit modal
│   │   │   └── CreateEntityModal/ # Multi-step entity creation
│   │   │       ├── CreateEntityModal.tsx # Main modal component
│   │   │       ├── FieldControls.tsx    # Dynamic field inputs
│   │   │       ├── LinkEditor.tsx       # Entity relationship linking
│   │   │       ├── StepChooseTemplate.tsx # Template selection
│   │   │       └── StepFillForm.tsx     # Field completion
│   │   ├── folders/            # Folder management components
│   │   │   ├── FolderCard.tsx  # Folder display card
│   │   │   └── FolderGrid.tsx  # Folder grid layout
│   │   ├── templates/          # Template management components
│   │   │   ├── TemplateCard.tsx # Template display card
│   │   │   ├── TemplateEditor.tsx # Template editing interface
│   │   │   └── TemplateGrid.tsx # Template grid layout
│   │   ├── worlds/             # World management components
│   │   │   ├── CreateWorldModal.tsx # 15-field world creation
│   │   │   ├── NewWorldModal.tsx    # Simple world creation
│   │   │   ├── WorldCard.tsx        # World display card
│   │   │   ├── WorldEditModal.tsx   # World editing interface
│   │   │   └── WorldGrid.tsx        # World grid layout
│   │   ├── relationships/      # Relationship visualization
│   │   │   ├── CreateRelationshipModal.tsx # Relationship creation
│   │   │   ├── RelationshipGraph.tsx       # Visual mapping
│   │   │   └── RelationshipTable.tsx       # Tabular view
│   │   └── header/             # Application header
│   │       └── AppHeader.tsx   # Main application header
│   └── lib/                    # Utilities and configuration
│       ├── types.ts           # TypeScript type definitions
│       ├── store.ts           # Zustand state management
│       ├── mockData.ts        # Development seed data
│       ├── formSchemas.ts     # Form validation schemas
│       ├── coreTemplates.ts   # Core template definitions
│       ├── utils.ts           # Utility functions
│       └── database/          # Database layer
│           └── local.ts       # PostgreSQL database service
├── scripts/                   # Development scripts
│   ├── test-local-db.js      # Database connection test
│   └── test-database-service.ts # Service layer test
├── public/                    # Static assets
│   ├── file.svg              # File icon
│   ├── globe.svg             # Globe icon
│   ├── next.svg              # Next.js logo
│   ├── vercel.svg            # Vercel logo
│   └── window.svg            # Window icon
├── local_database_schema.sql  # Complete PostgreSQL schema
├── fix_templates.sql         # Template installation script
├── .env.local                # Local environment variables
├── .env.local.example        # Environment template
├── package.json               # Dependencies and scripts
├── tailwind.config.ts         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
├── postcss.config.mjs         # PostCSS ES module config
├── next.config.ts             # Next.js configuration
├── next-env.d.ts              # Next.js TypeScript definitions
├── tsconfig.json              # TypeScript configuration
├── eslint.config.mjs          # ESLint configuration
├── README.md                  # Project documentation
├── DEVELOPMENT.md             # Development documentation
└── GEMINI.md                  # Additional documentation
```

## 🎯 Core Data Models

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

## 🔧 Development Setup

### Prerequisites
- Node.js 20+ 
- npm 9+
- PostgreSQL 14+ (17.5 recommended)
- Modern browser with ES2022 support

### Installation
```bash
cd worldweaver-ui
npm install
```

### Database Setup
```bash
# 1. Ensure PostgreSQL is running
psql --version

# 2. Test database connection
node scripts/test-local-db.js

# 3. View database in pgAdmin 4 (optional)
# Already installed with PostgreSQL
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
- `node scripts/test-local-db.js` - Test database connection

## 🎨 UI Component Library

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

## 🌟 Key Features Implemented

### 1. Local Database Integration ✅
- **PostgreSQL 17.5** local database setup and configuration
- **Complete schema** with 11 tables and proper relationships
- **8 system templates** automatically installed (Character, Location, Object, Organization, Event, Species, Religion, Magic System)
- **Database service layer** with TypeScript support and type safety
- **Connection testing** and verification scripts
- **Environment configuration** for local development

### 2. Database Service Layer ✅
- **LocalDatabaseService class** with comprehensive CRUD operations
- **Type-safe interfaces** for all database entities
- **Connection pooling** with proper resource management
- **Error handling** and validation
- **Development utilities** for testing and debugging

### 3. Enhanced Creation Button Hover Effects ✅
- **Unified Design Language** - All creation buttons share consistent interactive patterns
- **Color-Coded Actions** - Each creation type has distinctive gradients:
  - 🌍 **New World** - Blue/purple gradient (world-level actions)
  - 👥 **Create Entity** - Green/blue gradient (entity-level actions)
  - 📋 **Create Template** - Amber/orange gradient (template-level actions)
  - 🔗 **Create Relationship** - Purple/pink gradient (relationship-level actions)
- **Premium Animations** - Scale transforms, elevation effects, rotating icons, gradient overlays
- **Enhanced Shadows** - Color-matched glows (blue, green, amber, purple shadows)
- **Smooth Transitions** - 300ms coordinated animations across all elements

### 2. Enhanced Card Hover Effects
- Consistent hover animations across all card components
- Blue hover effects for entities, amber for templates
- Smooth transitions with transform and color changes

### 3. World Cards with Premium Animations
- Floating particle effects with geometric patterns
- Dynamic hover states with depth and movement
- Visual hierarchy with gradient overlays

### 4. Comprehensive Settings Page
- 5 tabbed sections: General, Appearance, Data & Storage, Privacy, Notifications
- Proper TypeScript interfaces for all components
- Form state management with validation

### 5. Entity & Template Creation
- **CreateEntityModal** (`/src/components/entities/CreateEntityModal/CreateEntityModal.tsx`) - Multi-step creation workflows
- **StepChooseTemplate** (`/src/components/entities/CreateEntityModal/StepChooseTemplate.tsx`) - Template selection step
- **StepFillForm** (`/src/components/entities/CreateEntityModal/StepFillForm.tsx`) - Field completion step
- **FieldControls** (`/src/components/entities/CreateEntityModal/FieldControls.tsx`) - Dynamic field input controls
- **LinkEditor** (`/src/components/entities/CreateEntityModal/LinkEditor.tsx`) - Entity relationship linking
- Dynamic field management for templates
- Folder assignment and organization
- Form validation with user feedback

### 6. Comprehensive World Creation
- **15-field detailed world creation form** with 3-step wizard:
  - **Step 1 - Core Information:** Name, logline, genre blend, tone, themes
  - **Step 2 - World Parameters:** Audience rating, scope/scale, technology/magic levels, cosmology, climate/biomes
  - **Step 3 - World Details:** Calendar/timekeeping, societal overview, conflict drivers, rules/constraints, aesthetic direction
- Multi-select field controls with visual tags
- Form validation and error handling
- Progress indicator and step navigation
- Comprehensive dropdown options for all world-building aspects

### 7. Relationship Management System
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

### 9. Core Template System
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

### 10. Entity Detail Modal System
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

### 12. World Editing System
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

### 11. Template Editing System
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

## ⚠️ Known Issues & Technical Debt

### Current Status ✅
- **Database Integration Complete** - Local PostgreSQL fully operational
- **Service Layer Complete** - TypeScript database service implemented
- **Environment Setup Complete** - Development environment configured
- **Testing Infrastructure** - Database testing scripts functional

### Areas for Improvement
1. **Mock Data Migration** - Replace remaining mock data with database calls
2. **Authentication Integration** - Implement NextAuth.js with local database
3. **Error Boundaries** - Add comprehensive error handling
4. **Performance Optimization** - Implement caching and optimization
5. **Real-time Features** - Add live collaboration capabilities

## 🚧 Development Priorities

### Immediate (Next Sprint)
1. **Replace Mock Data** - Migrate all components to use database service
2. **Authentication Setup** - Implement NextAuth.js with PostgreSQL adapter
3. **Error Handling** - Add try/catch blocks and error boundaries
4. **Form Validation** - Enhance client-side validation

### Short Term (1-2 Weeks)
1. **Search & Filtering** - Implement comprehensive search across entities
2. **Bulk Operations** - Multi-select and bulk actions
3. **Import/Export** - Data backup and migration tools
4. **Performance Monitoring** - Add logging and performance metrics

### Medium Term (1 Month)
1. **Supabase Migration** - Prepare for cloud database deployment
2. **Real-time Features** - WebSocket integration for live updates
3. **Mobile Responsiveness** - Optimize for mobile devices
4. **Advanced Visualization** - Enhanced relationship graphs

### Long Term (3+ Months)
1. **Multi-user Collaboration** - Real-time collaborative editing
2. **AI Integration** - Content generation and assistance
3. **Plugin System** - Extensible architecture
4. **Advanced Analytics** - Usage insights and reporting

## 📋 Database Development Workflow

### Daily Development
```bash
# Start development
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

## 📋 Component Interface Reference

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

## 🔍 Debugging & Development Tips

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

## 📞 Support & Resources

### Key Files for Reference
- `/src/lib/database/local.ts` - Database service layer with all operations
- `/src/lib/types.ts` - TypeScript definitions and interfaces
- `/src/lib/store.ts` - Zustand state management patterns
- `/local_database_schema.sql` - Complete PostgreSQL schema
- `/.env.local` - Environment variables for local development
- `/scripts/test-local-db.js` - Database connection testing
- `/LOCAL_DATABASE_SETUP.md` - Complete database setup guide
- `/LOCAL_DATABASE_SUCCESS.md` - Setup completion reference

### Development Environment
- **IDE:** VS Code recommended with TypeScript and Tailwind extensions
- **Database:** pgAdmin 4 for visual database management
- **Browser:** Chrome/Edge with React Developer Tools
- **Debugging:** React DevTools, Zustand DevTools, PostgreSQL logs

### Quick Reference
| Operation | Command |
|-----------|---------|
| **Start Dev Server** | `npm run dev` |
| **Test Database** | `node scripts/test-local-db.js` |
| **Connect to DB** | `psql -U worldweaver_user -d worldweaver_dev -h localhost` |
| **Backup Database** | `pg_dump worldweaver_dev > backup.sql` |
| **View in pgAdmin** | Start pgAdmin 4 from Windows Start Menu |

---

**Note:** This documentation reflects the current state as of September 6, 2025, including the completed local PostgreSQL database integration. The application now has full database persistence and is ready for production-level development. Keep this updated as features are migrated from mock data to database operations.
