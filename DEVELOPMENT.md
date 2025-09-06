# WorldWeaver UI - Development Documentation

**Last Up   │   ├── relationships/      # Relationship visualization and management
   │   └── header/             # Application headerted:** September 5, 2025  
**Version:** 0.1.0  
**Build Status:** Active Development  
**Latest Changes:** Enhanced creation button hover effects, relationship management system, comprehensive UI polish, world editing functionality

## 🚀 Project Overview

WorldWeaver is a sophisticated world-building application designed for creative professionals,- ✅ **World Deletion & Archiving** - Complete world management with delete and archive functionality ✅
- ✅ **Profile Management System** - Comprehensive user profile page with tabbed interface ✅  
- ✅ **World Membership System** - Complete collaboration interface with members, invites, roles, and settings ✅riters, and game developers. It provides a comprehensive platform for creating, organizing, and managing fictional worlds with entities, relationships, and custom templates.

### Key Features
- **World Management:** Create and organize multiple fictional worlds
- **Entity System:** Define characters, locations, items, and custom entities
- **Template Engine:** Create reusable templates with custom fields
- **Relationship Mapping:** Visual and tabular relationship management with notes and context
- **Folder Organization:** Organize entities and templates into folders
- **Advanced UI:** Modern interface with premium hover effects and animations
- **Comprehensive Creation Workflows:** Multi-step wizards for worlds, entities, templates, and relationships

## 🛠️ Technology Stack

### Core Framework
- **Next.js 15.5.2** - React framework with App Router
- **React 19.1.0** - Latest React with modern hooks
- **TypeScript 5** - Full type safety throughout the application

### Styling & UI
- **Tailwind CSS 4.1.13** - Utility-first CSS framework with modern features
- **PostCSS 8.5.6** - CSS processing with Tailwind integration
- **Custom Components** - Reusable UI component library

### 11. State Management
- **Zustand 5.0.8** - Lightweight state management for global app state

### Development Tools
- **ESLint 9** - Code linting with Next.js configuration
- **Vitest** - Testing framework (configured but not extensively used yet)

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
│       └── utils.ts           # Utility functions
├── public/                     # Static assets
│   ├── file.svg               # File icon
│   ├── globe.svg              # Globe icon
│   ├── next.svg               # Next.js logo
│   ├── vercel.svg             # Vercel logo
│   └── window.svg             # Window icon
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
- Modern browser with ES2022 support

### Installation
```bash
cd worldweaver-ui
npm install
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

### 1. Enhanced Creation Button Hover Effects
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

### Current Challenges
1. **Terminal Issues** - Development server has experienced exit code 1 errors
2. **Component Interface Compliance** - Recently fixed TypeScript interface mismatches
3. **Testing Coverage** - Limited test suite implementation
4. **Error Boundaries** - Need comprehensive error handling

### Recent Fixes
- ✅ Fixed Card component prop usage (removed non-existent title/description props)
- ✅ Fixed Toggle component interface (uses `pressed` instead of `checked`)
- ✅ Fixed Tabs component interface (uses `activeKey/onChange` instead of `activeTab/onTabChange`)
- ✅ Fixed module export issues in AppHeader component
- ✅ Enhanced EmptyState component with creation-specific hover effects
- ✅ Implemented comprehensive hover effects across all creation buttons
- ✅ **Entity Detail Pages** - Complete entity view/edit functionality with modal interface
- ✅ **Core Template System** - Character, Location, Object, Organization, Culture, Species, Religion/Philosophy, Government & Law, Power System, Economy & Trade, Creature (Fauna), Plant/Fungi, Material/Resource, Monster, Magic Item, Event, Recipe, and Illness templates automatically created for all worlds
- ✅ **Template Editing System** - Comprehensive template editing with world-specific core template customization
- ✅ **Dynamic Folder Counts** - Folder cards now show accurate counts calculated from actual data instead of hardcoded values
- ✅ **Dynamic World Entity Counts** - World cards and dashboard stats now show accurate entity counts calculated from actual data
- ✅ **World Editing Functionality** - Complete world editing interface with 15-field form using WorldEditModal
- ✅ **World Deletion & Archiving** - Complete world management with delete and archive functionality
- ✅ **Profile Management System** - Comprehensive user profile page with tabbed interface

## 🚧 Development Priorities

### Immediate (Next Sprint)
1. **Complete World Creation Data Storage** - Store detailed world creation data beyond just name/summary
2. ✅ **Entity Detail Pages** - Complete entity view/edit functionality ✅

### 13. World Management System
- **World Deletion** (`/src/components/worlds/DeleteWorldModal.tsx`) - Comprehensive world deletion with confirmation:
  - Warning dialog with detailed information about data loss
  - Cascading deletion of all related data (entities, templates, folders, relationships)
  - Professional confirmation interface with loading states
  - Clear visualization of what will be permanently removed
- **World Archiving** (`/src/components/worlds/ArchiveWorldModal.tsx`) - World archiving and restoration:
  - Archive worlds to hide them from main dashboard
  - Restore archived worlds at any time
  - Clear distinction between archived and active worlds
  - Preservation of all world data during archiving
- **Enhanced WorldCard** (`/src/components/worlds/WorldCard.tsx`) - Action dropdown menu:
  - Three-dot menu with Edit, Archive/Unarchive, and Delete options
  - Visual archive indicators with amber styling
  - Disabled interactions for archived worlds (no Enter button)
  - Professional hover effects and state management
- **Dashboard Filtering** (`/src/app/page.tsx`) - Active vs archived world views:
  - Toggle between active and archived worlds
  - Separate statistics for each view
  - Mobile-friendly archive toggle button
  - Contextual UI updates based on archive state
- **Store Integration** (`/src/lib/store.ts`) - Complete CRUD operations:
  - `deleteWorld()` - Cascading deletion with all related data
  - `archiveWorld()` / `unarchiveWorld()` - Toggle archive status
  - Automatic timestamp updates for all operations
  - Type-safe world state management

### 14. Profile Management System
- **Profile Page** (`/src/app/profile/page.tsx`) - Comprehensive user profile management:
  - **General Tab** - Personal information editing (name, email, username, bio, location, website)
  - **Preferences Tab** - Application preferences (language, timezone, theme, display options)
  - **Notifications Tab** - Email and push notification settings with granular controls
  - **Privacy Tab** - Profile visibility and data management options
  - **Avatar System** - Gradient-based avatar with initials and hover effects
  - **Professional UI** - Consistent styling with WorldWeaver design system
  - **Form State Management** - Real-time updates with save change detection
  - **Responsive Design** - Mobile-friendly layout with proper spacing
  - **Danger Zone** - Account deletion with proper warnings
3. ✅ **Core Templates Complete** - Character, Location, Object, Organization, Culture, Species, Religion/Philosophy, Government & Law, Power System, Economy & Trade, Creature (Fauna), Plant/Fungi, Material/Resource, Monster, Magic Item, Event, Recipe, and Illness templates ✅
4. ✅ **World Editing Functionality** - Create WorldEditModal to edit existing world details using the 15-field form ✅
5. ✅ **World Deletion & Archiving** - Complete world management with delete and archive functionality ✅
6. ✅ **Profile Management System** - Comprehensive user profile page with tabbed interface ✅
7. **Relationship Detail Management** - Edit/delete existing relationships, bidirectional relationships
8. **Data Persistence** - Add local storage or database integration

### Short Term (1-2 Weeks)
1. **Search & Filtering** - Implement comprehensive search across all entities
2. **Bulk Operations** - Multi-select and bulk actions for entities/templates
3. **Import/Export** - Data import/export functionality
4. **Advanced Templates** - Rich text fields, file uploads, complex validation

### Medium Term (1 Month)
1. **Collaboration Features** - Multi-user support and sharing
2. **Advanced Visualization** - Enhanced relationship graphs and data views
3. **Mobile Responsiveness** - Optimize for mobile devices
4. **Performance Optimization** - Virtualization for large datasets

### Long Term (3+ Months)
1. **Plugin System** - Extensible architecture for custom functionality
2. **AI Integration** - Content generation and assistance features
3. **Cloud Sync** - Real-time synchronization across devices
4. **Advanced Analytics** - Usage insights and content analytics

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
- `/src/lib/types.ts` - All TypeScript definitions and interfaces
- `/src/lib/store.ts` - Zustand state management patterns and actions
- `/src/lib/coreTemplates.ts` - Core template definitions (Character, Location, Object, Organization, Culture, Species, Religion/Philosophy, Government & Law, Power System, Economy & Trade, Creature (Fauna), Plant/Fungi, Material/Resource, Monster, Magic Item, Event, Recipe, Illness)
- `/src/lib/mockData.ts` - Development seed data and sample entities
- `/src/lib/formSchemas.ts` - Form validation schemas
- `/src/lib/utils.ts` - Utility functions and helpers
- `/src/components/ui/` - Base UI component library and interfaces
- `/src/app/page.tsx` - Main dashboard implementation
- `/src/app/world/[id]/page.tsx` - Individual world pages
- `/src/app/settings/page.tsx` - Complex form implementation example
- `/src/app/profile/page.tsx` - User profile management with tabbed interface
- `/src/components/worlds/CreateWorldModal.tsx` - 15-field comprehensive world creation wizard
- `/src/components/worlds/WorldEditModal.tsx` - Complete world editing interface with 15-field form and step navigation
- `/src/components/worlds/WorldCard.tsx` - World card component with hover effects
- `/src/components/worlds/WorldGrid.tsx` - World grid layout component
- `/src/components/relationships/CreateRelationshipModal.tsx` - Relationship creation with notes and validation
- `/src/components/entities/EntityDetailModal.tsx` - Entity detail viewing and editing interface
- `/src/components/entities/CreateEntityModal/` - Multi-step entity creation workflow
- `/src/components/templates/TemplateEditor.tsx` - Comprehensive template editing interface
- `/src/components/templates/TemplateCard.tsx` - Template card display component
- `/src/components/folders/FolderCard.tsx` - Folder card with dynamic counts
- `/src/components/dashboard/TabNav.tsx` - Dashboard navigation tabs
- `/src/components/dashboard/WorldContextBar.tsx` - World context information bar

### Development Environment
- **IDE:** VS Code recommended with TypeScript and Tailwind extensions
- **Browser:** Chrome/Edge with React Developer Tools
- **Debugging:** Use React DevTools and Zustand DevTools

---

**Note:** This documentation reflects the current state as of September 5, 2025. Keep this updated as features are added or modified. The application is in active development with a focus on TypeScript compliance and modern React patterns.
