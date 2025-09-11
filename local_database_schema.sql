-- ================================
-- WorldWeaver Local Database Schema
-- For local development without Supabase
-- ================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- NEXTAUTH.JS TABLES
-- ================================

-- NextAuth.js Account table
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "userId" UUID NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, "providerAccountId")
);

-- NextAuth.js Session table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" UUID NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NextAuth.js VerificationToken table
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(identifier, token)
);

-- ================================
-- USERS TABLE (Replaces Supabase auth.users)
-- ================================

-- Users table (compatible with NextAuth.js)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  "emailVerified" TIMESTAMP WITH TIME ZONE,
  image TEXT,
  password_hash TEXT, -- For credentials provider
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legacy auth_users table for backward compatibility (will be migrated)
CREATE TABLE IF NOT EXISTS public.auth_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  email_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES public.auth_users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- CORE TABLES (Same as production)
-- ================================

-- Worlds table
CREATE TABLE IF NOT EXISTS public.worlds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- World members table
CREATE TABLE IF NOT EXISTS public.world_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(world_id, user_id)
);

-- World invites table
CREATE TABLE IF NOT EXISTS public.world_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates table
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  is_system BOOLEAN DEFAULT false,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Folders table
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
  color TEXT DEFAULT 'blue',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Entities table
CREATE TABLE IF NOT EXISTS public.entities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
  folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  data JSONB DEFAULT '{}',
  image_url TEXT,
  tags TEXT[],
  is_archived BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relationships table
CREATE TABLE IF NOT EXISTS public.relationships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
  to_entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL,
  description TEXT,
  strength INTEGER DEFAULT 5 CHECK (strength >= 1 AND strength <= 10),
  is_bidirectional BOOLEAN DEFAULT false,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_entity_id, to_entity_id, relationship_type)
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- World files table
CREATE TABLE IF NOT EXISTS public.world_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INDEXES (Same as production)
-- ================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_worlds_owner_id ON public.worlds(owner_id);
CREATE INDEX IF NOT EXISTS idx_world_members_world_id ON public.world_members(world_id);
CREATE INDEX IF NOT EXISTS idx_world_members_user_id ON public.world_members(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_world_id ON public.templates(world_id);
CREATE INDEX IF NOT EXISTS idx_entities_world_id ON public.entities(world_id);
CREATE INDEX IF NOT EXISTS idx_entities_template_id ON public.entities(template_id);
CREATE INDEX IF NOT EXISTS idx_entities_tags ON public.entities USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_relationships_from_entity_id ON public.relationships(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to_entity_id ON public.relationships(to_entity_id);

-- NextAuth.js indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON public.accounts("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions("sessionToken");
CREATE INDEX IF NOT EXISTS idx_verification_tokens_identifier ON public.verification_tokens(identifier);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON public.verification_tokens(token);

-- ================================
-- FUNCTIONS
-- ================================

-- Function to handle profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- TRIGGERS
-- ================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON public.auth_users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_worlds_updated_at BEFORE UPDATE ON public.worlds
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_templates_updated_at BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_entities_updated_at BEFORE UPDATE ON public.entities
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_sessions_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ================================
-- FOREIGN KEY CONSTRAINTS
-- ================================

-- Add foreign key constraints for NextAuth.js tables
ALTER TABLE public.accounts ADD CONSTRAINT fk_accounts_user_id 
  FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.sessions ADD CONSTRAINT fk_sessions_user_id 
  FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;

-- ================================
-- SYSTEM TEMPLATES
-- ================================

INSERT INTO public.templates (name, description, icon, category, fields, is_system) VALUES
('Character', 'People, creatures, and sentient beings', 'user', 'Character', '[
  {"name": "name", "type": "text", "label": "Name", "required": true},
  {"name": "appearance", "type": "textarea", "label": "Appearance"},
  {"name": "personality", "type": "textarea", "label": "Personality"},
  {"name": "background", "type": "textarea", "label": "Background"},
  {"name": "goals", "type": "textarea", "label": "Goals & Motivations"},
  {"name": "skills", "type": "tags", "label": "Skills & Abilities"}
]', true),

('Location', 'Places, regions, and geographical areas', 'map-pin', 'Location', '[
  {"name": "name", "type": "text", "label": "Name", "required": true},
  {"name": "type", "type": "select", "label": "Location Type", "options": ["City", "Town", "Village", "Region", "Building", "Landmark"]},
  {"name": "description", "type": "textarea", "label": "Description"},
  {"name": "geography", "type": "textarea", "label": "Geography & Climate"},
  {"name": "population", "type": "text", "label": "Population"},
  {"name": "culture", "type": "textarea", "label": "Culture & Society"}
]', true),

('Object', 'Items, artifacts, and physical things', 'package', 'Object', '[
  {"name": "name", "type": "text", "label": "Name", "required": true},
  {"name": "type", "type": "select", "label": "Object Type", "options": ["Weapon", "Armor", "Tool", "Artifact", "Book", "Other"]},
  {"name": "description", "type": "textarea", "label": "Description"},
  {"name": "properties", "type": "textarea", "label": "Properties & Abilities"},
  {"name": "history", "type": "textarea", "label": "History & Origin"},
  {"name": "rarity", "type": "select", "label": "Rarity", "options": ["Common", "Uncommon", "Rare", "Legendary"]}
]', true),

('Organization', 'Groups, factions, and institutions', 'users', 'Organization', '[
  {"name": "name", "type": "text", "label": "Name", "required": true},
  {"name": "type", "type": "select", "label": "Organization Type", "options": ["Government", "Military", "Religious", "Guild", "Company", "Secret Society"]},
  {"name": "description", "type": "textarea", "label": "Description"},
  {"name": "leadership", "type": "textarea", "label": "Leadership Structure"},
  {"name": "goals", "type": "textarea", "label": "Goals & Agenda"},
  {"name": "resources", "type": "textarea", "label": "Resources & Assets"}
]', true),

('Event', 'Historical events and occurrences', 'calendar', 'Event', '[
  {"name": "name", "type": "text", "label": "Event Name", "required": true},
  {"name": "date", "type": "text", "label": "Date/Time"},
  {"name": "description", "type": "textarea", "label": "Description"},
  {"name": "participants", "type": "textarea", "label": "Key Participants"},
  {"name": "consequences", "type": "textarea", "label": "Consequences"},
  {"name": "significance", "type": "textarea", "label": "Historical Significance"}
]', true),

('Species', 'Races and species in your world', 'dna', 'Species', '[
  {"name": "name", "type": "text", "label": "Species Name", "required": true},
  {"name": "appearance", "type": "textarea", "label": "Physical Appearance"},
  {"name": "traits", "type": "textarea", "label": "Notable Traits"},
  {"name": "culture", "type": "textarea", "label": "Culture & Society"},
  {"name": "habitat", "type": "textarea", "label": "Natural Habitat"},
  {"name": "abilities", "type": "textarea", "label": "Special Abilities"}
]', true),

('Religion', 'Belief systems and deities', 'star', 'Religion', '[
  {"name": "name", "type": "text", "label": "Religion Name", "required": true},
  {"name": "deity", "type": "text", "label": "Primary Deity/Deities"},
  {"name": "beliefs", "type": "textarea", "label": "Core Beliefs"},
  {"name": "practices", "type": "textarea", "label": "Practices & Rituals"},
  {"name": "followers", "type": "textarea", "label": "Followers & Clergy"},
  {"name": "influence", "type": "textarea", "label": "Influence & Power"}
]', true),

('Magic System', 'Magical systems and rules', 'sparkles', 'Magic', '[
  {"name": "name", "type": "text", "label": "System Name", "required": true},
  {"name": "source", "type": "text", "label": "Power Source"},
  {"name": "rules", "type": "textarea", "label": "Rules & Limitations"},
  {"name": "practitioners", "type": "textarea", "label": "Who Can Use It"},
  {"name": "effects", "type": "textarea", "label": "Possible Effects"},
  {"name": "cost", "type": "textarea", "label": "Cost & Consequences"}
]', true)

ON CONFLICT (name) WHERE is_system = true DO NOTHING;

-- ================================
-- SAMPLE DATA FOR DEVELOPMENT
-- ================================

-- Insert a test user
INSERT INTO public.auth_users (id, email, email_confirmed) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'developer@worldweaver.com', true)
ON CONFLICT (email) DO NOTHING;

-- Profile will be created automatically via trigger

-- ================================
-- SUCCESS MESSAGE
-- ================================

DO $$
BEGIN
  RAISE NOTICE 'WorldWeaver local database setup completed!';
  RAISE NOTICE 'Test user created: developer@worldweaver.com';
  RAISE NOTICE 'Templates created: %', (SELECT COUNT(*) FROM public.templates WHERE is_system = true);
END $$;
