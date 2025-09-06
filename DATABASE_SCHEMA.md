# WorldWeaver Database Schema - Complete SQL Script

**Project:** WorldWeaver UI - Database Setup  
**Version:** 1.0  
**Last Updated:** September 5, 2025

This document contains the complete SQL script to set up the WorldWeaver database schema in Supabase. Run this script in your Supabase SQL Editor to create all tables, policies, and functions.

## 📋 Prerequisites

- Supabase project created
- Access to SQL Editor in Supabase dashboard
- Project configured with authentication enabled

## 🗄️ Complete Database Schema Script

Copy and paste the following SQL script into your Supabase SQL Editor and run it:

```sql
-- ================================
-- WorldWeaver Database Schema Setup
-- Version: 1.0
-- ================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- TABLES
-- ================================

-- Users/Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- World members table (for collaboration)
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

-- Folders table (for organization)
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

-- Entities table (main content)
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

-- Activity log table
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

-- File storage table
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
-- INDEXES for Performance
-- ================================

-- Worlds indexes
CREATE INDEX IF NOT EXISTS idx_worlds_owner_id ON public.worlds(owner_id);
CREATE INDEX IF NOT EXISTS idx_worlds_is_public ON public.worlds(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_worlds_is_archived ON public.worlds(is_archived);

-- World members indexes
CREATE INDEX IF NOT EXISTS idx_world_members_world_id ON public.world_members(world_id);
CREATE INDEX IF NOT EXISTS idx_world_members_user_id ON public.world_members(user_id);

-- Templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_world_id ON public.templates(world_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_system ON public.templates(is_system);
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);

-- Entities indexes
CREATE INDEX IF NOT EXISTS idx_entities_world_id ON public.entities(world_id);
CREATE INDEX IF NOT EXISTS idx_entities_template_id ON public.entities(template_id);
CREATE INDEX IF NOT EXISTS idx_entities_folder_id ON public.entities(folder_id);
CREATE INDEX IF NOT EXISTS idx_entities_is_archived ON public.entities(is_archived);
CREATE INDEX IF NOT EXISTS idx_entities_tags ON public.entities USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_entities_data ON public.entities USING GIN(data);

-- Folders indexes
CREATE INDEX IF NOT EXISTS idx_folders_world_id ON public.folders(world_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);

-- Relationships indexes
CREATE INDEX IF NOT EXISTS idx_relationships_from_entity_id ON public.relationships(from_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_to_entity_id ON public.relationships(to_entity_id);
CREATE INDEX IF NOT EXISTS idx_relationships_world_id ON public.relationships(world_id);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_world_id ON public.activity_logs(world_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- World files indexes
CREATE INDEX IF NOT EXISTS idx_world_files_world_id ON public.world_files(world_id);

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- ================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.world_files ENABLE ROW LEVEL SECURITY;

-- ================================
-- PROFILES POLICIES
-- ================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can view public profiles (for collaboration)
CREATE POLICY "Users can view public profiles" ON public.profiles
  FOR SELECT USING (
    id IN (
      SELECT DISTINCT user_id FROM public.world_members 
      WHERE world_id IN (
        SELECT id FROM public.worlds 
        WHERE owner_id = auth.uid() OR id IN (
          SELECT world_id FROM public.world_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- ================================
-- WORLDS POLICIES
-- ================================

-- Users can view accessible worlds
CREATE POLICY "Users can view accessible worlds" ON public.worlds
  FOR SELECT USING (
    is_public = true OR 
    owner_id = auth.uid() OR
    id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can create worlds
CREATE POLICY "Users can create worlds" ON public.worlds
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Users can update worlds they own or admin
CREATE POLICY "Users can update owned/admin worlds" ON public.worlds
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

-- Users can delete worlds they own
CREATE POLICY "Users can delete owned worlds" ON public.worlds
  FOR DELETE USING (owner_id = auth.uid());

-- ================================
-- WORLD MEMBERS POLICIES
-- ================================

-- Users can view members of accessible worlds
CREATE POLICY "Users can view world members" ON public.world_members
  FOR SELECT USING (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = auth.uid() OR id IN (
        SELECT world_id FROM public.world_members WHERE user_id = auth.uid()
      )
    )
  );

-- World owners and admins can manage members
CREATE POLICY "Owners and admins can manage members" ON public.world_members
  FOR ALL USING (
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = auth.uid()
    ) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

-- ================================
-- WORLD INVITES POLICIES
-- ================================

-- Users can view invites for their worlds or sent to them
CREATE POLICY "Users can view relevant invites" ON public.world_invites
  FOR SELECT USING (
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = auth.uid()
    ) OR
    invited_by = auth.uid() OR
    email IN (
      SELECT email FROM public.profiles WHERE id = auth.uid()
    )
  );

-- World owners and admins can create invites
CREATE POLICY "Owners and admins can create invites" ON public.world_invites
  FOR INSERT WITH CHECK (
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = auth.uid()
    ) OR
    world_id IN (
      SELECT world_id FROM public.world_members 
      WHERE user_id = auth.uid() AND role IN ('admin')
    )
  );

-- ================================
-- TEMPLATES POLICIES
-- ================================

-- Users can view system templates or templates in accessible worlds
CREATE POLICY "Users can view accessible templates" ON public.templates
  FOR SELECT USING (
    is_system = true OR
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = auth.uid() OR id IN (
        SELECT world_id FROM public.world_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can create templates in their worlds
CREATE POLICY "Users can create world templates" ON public.templates
  FOR INSERT WITH CHECK (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = auth.uid() OR id IN (
        SELECT world_id FROM public.world_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
      )
    )
  );

-- Users can update templates they created
CREATE POLICY "Users can update own templates" ON public.templates
  FOR UPDATE USING (
    created_by = auth.uid() OR
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = auth.uid()
    )
  );

-- ================================
-- ENTITIES POLICIES
-- ================================

-- Users can view entities in accessible worlds
CREATE POLICY "Users can view accessible entities" ON public.entities
  FOR SELECT USING (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE is_public = true OR owner_id = auth.uid() OR id IN (
        SELECT world_id FROM public.world_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can create entities in worlds they have access to
CREATE POLICY "Users can create entities" ON public.entities
  FOR INSERT WITH CHECK (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = auth.uid() OR id IN (
        SELECT world_id FROM public.world_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
      )
    )
  );

-- Users can update entities they can access
CREATE POLICY "Users can update accessible entities" ON public.entities
  FOR UPDATE USING (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = auth.uid() OR id IN (
        SELECT world_id FROM public.world_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
      )
    )
  );

-- Users can delete entities they created or in worlds they own
CREATE POLICY "Users can delete entities" ON public.entities
  FOR DELETE USING (
    created_by = auth.uid() OR
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = auth.uid()
    )
  );

-- ================================
-- FOLDERS POLICIES
-- ================================

-- Users can view folders in accessible worlds
CREATE POLICY "Users can view accessible folders" ON public.folders
  FOR SELECT USING (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = auth.uid() OR id IN (
        SELECT world_id FROM public.world_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can manage folders in accessible worlds
CREATE POLICY "Users can manage folders" ON public.folders
  FOR ALL USING (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = auth.uid() OR id IN (
        SELECT world_id FROM public.world_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
      )
    )
  );

-- ================================
-- RELATIONSHIPS POLICIES
-- ================================

-- Users can view relationships in accessible worlds
CREATE POLICY "Users can view accessible relationships" ON public.relationships
  FOR SELECT USING (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = auth.uid() OR id IN (
        SELECT world_id FROM public.world_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can manage relationships in accessible worlds
CREATE POLICY "Users can manage relationships" ON public.relationships
  FOR ALL USING (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = auth.uid() OR id IN (
        SELECT world_id FROM public.world_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
      )
    )
  );

-- ================================
-- ACTIVITY LOGS POLICIES
-- ================================

-- Users can view activity logs for accessible worlds
CREATE POLICY "Users can view world activity" ON public.activity_logs
  FOR SELECT USING (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = auth.uid() OR id IN (
        SELECT world_id FROM public.world_members WHERE user_id = auth.uid()
      )
    )
  );

-- System can insert activity logs
CREATE POLICY "System can insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (true);

-- ================================
-- WORLD FILES POLICIES
-- ================================

-- Users can view files in accessible worlds
CREATE POLICY "Users can view world files" ON public.world_files
  FOR SELECT USING (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = auth.uid() OR id IN (
        SELECT world_id FROM public.world_members WHERE user_id = auth.uid()
      )
    )
  );

-- Users can upload files to accessible worlds
CREATE POLICY "Users can upload files" ON public.world_files
  FOR INSERT WITH CHECK (
    world_id IN (
      SELECT id FROM public.worlds 
      WHERE owner_id = auth.uid() OR id IN (
        SELECT world_id FROM public.world_members 
        WHERE user_id = auth.uid() AND role IN ('admin', 'editor')
      )
    )
  );

-- Users can delete files they uploaded
CREATE POLICY "Users can delete own files" ON public.world_files
  FOR DELETE USING (
    uploaded_by = auth.uid() OR
    world_id IN (
      SELECT id FROM public.worlds WHERE owner_id = auth.uid()
    )
  );

-- ================================
-- FUNCTIONS
-- ================================

-- Function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Triggers for updated_at timestamps
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_worlds_updated_at BEFORE UPDATE ON public.worlds
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_templates_updated_at BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_entities_updated_at BEFORE UPDATE ON public.entities
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_folders_updated_at BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ================================
-- INITIAL SYSTEM DATA
-- ================================

-- Insert system templates (will be available to all worlds)
INSERT INTO public.templates (name, description, icon, category, fields, is_system) VALUES
('Character', 'People, creatures, and sentient beings in your world', 'user', 'Character', '[
  {"name": "name", "type": "text", "label": "Name", "required": true},
  {"name": "appearance", "type": "textarea", "label": "Appearance"},
  {"name": "personality", "type": "textarea", "label": "Personality"},
  {"name": "background", "type": "textarea", "label": "Background"},
  {"name": "goals", "type": "textarea", "label": "Goals & Motivations"},
  {"name": "skills", "type": "tags", "label": "Skills & Abilities"},
  {"name": "relationships", "type": "textarea", "label": "Key Relationships"}
]', true),

('Location', 'Places, regions, and geographical areas', 'map-pin', 'Location', '[
  {"name": "name", "type": "text", "label": "Name", "required": true},
  {"name": "type", "type": "select", "label": "Location Type", "options": ["City", "Town", "Village", "Region", "Country", "Continent", "Building", "Landmark", "Natural Feature"]},
  {"name": "description", "type": "textarea", "label": "Description"},
  {"name": "geography", "type": "textarea", "label": "Geography & Climate"},
  {"name": "population", "type": "text", "label": "Population"},
  {"name": "government", "type": "textarea", "label": "Government & Politics"},
  {"name": "culture", "type": "textarea", "label": "Culture & Society"},
  {"name": "economy", "type": "textarea", "label": "Economy & Trade"}
]', true),

('Object', 'Items, artifacts, and physical things', 'package', 'Object', '[
  {"name": "name", "type": "text", "label": "Name", "required": true},
  {"name": "type", "type": "select", "label": "Object Type", "options": ["Weapon", "Armor", "Tool", "Artifact", "Book", "Art", "Jewelry", "Currency", "Food", "Other"]},
  {"name": "description", "type": "textarea", "label": "Description"},
  {"name": "properties", "type": "textarea", "label": "Properties & Abilities"},
  {"name": "history", "type": "textarea", "label": "History & Origin"},
  {"name": "value", "type": "text", "label": "Value"},
  {"name": "rarity", "type": "select", "label": "Rarity", "options": ["Common", "Uncommon", "Rare", "Very Rare", "Legendary", "Unique"]}
]', true),

('Organization', 'Groups, factions, guilds, and institutions', 'users', 'Organization', '[
  {"name": "name", "type": "text", "label": "Name", "required": true},
  {"name": "type", "type": "select", "label": "Organization Type", "options": ["Guild", "Government", "Military", "Religious", "Criminal", "Academic", "Merchant", "Secret Society", "Tribe", "Family"]},
  {"name": "description", "type": "textarea", "label": "Description"},
  {"name": "purpose", "type": "textarea", "label": "Purpose & Goals"},
  {"name": "structure", "type": "textarea", "label": "Structure & Hierarchy"},
  {"name": "members", "type": "textarea", "label": "Notable Members"},
  {"name": "resources", "type": "textarea", "label": "Resources & Assets"},
  {"name": "reputation", "type": "textarea", "label": "Reputation & Influence"}
]', true),

('Event', 'Historical events, current happenings, and planned occurrences', 'calendar', 'Event', '[
  {"name": "name", "type": "text", "label": "Event Name", "required": true},
  {"name": "date", "type": "text", "label": "Date/Time"},
  {"name": "type", "type": "select", "label": "Event Type", "options": ["Battle", "Celebration", "Disaster", "Discovery", "Political", "Religious", "Personal", "Meeting", "Journey", "Other"]},
  {"name": "description", "type": "textarea", "label": "Description"},
  {"name": "participants", "type": "textarea", "label": "Key Participants"},
  {"name": "location", "type": "text", "label": "Location"},
  {"name": "outcome", "type": "textarea", "label": "Outcome & Consequences"},
  {"name": "significance", "type": "textarea", "label": "Historical Significance"}
]', true),

('Species', 'Races, creatures, and biological entities', 'dna', 'Species', '[
  {"name": "name", "type": "text", "label": "Species Name", "required": true},
  {"name": "classification", "type": "select", "label": "Classification", "options": ["Humanoid", "Beast", "Dragon", "Undead", "Elemental", "Fey", "Fiend", "Celestial", "Construct", "Plant", "Ooze", "Other"]},
  {"name": "description", "type": "textarea", "label": "Physical Description"},
  {"name": "habitat", "type": "textarea", "label": "Habitat & Environment"},
  {"name": "behavior", "type": "textarea", "label": "Behavior & Intelligence"},
  {"name": "abilities", "type": "textarea", "label": "Special Abilities"},
  {"name": "culture", "type": "textarea", "label": "Culture & Society"},
  {"name": "diet", "type": "textarea", "label": "Diet & Lifestyle"}
]', true),

('Religion', 'Deities, beliefs, and spiritual systems', 'star', 'Religion', '[
  {"name": "name", "type": "text", "label": "Religion/Deity Name", "required": true},
  {"name": "type", "type": "select", "label": "Type", "options": ["Deity", "Religion", "Cult", "Philosophy", "Spiritual Practice", "Pantheon"]},
  {"name": "description", "type": "textarea", "label": "Description"},
  {"name": "domains", "type": "tags", "label": "Domains & Spheres"},
  {"name": "beliefs", "type": "textarea", "label": "Core Beliefs"},
  {"name": "practices", "type": "textarea", "label": "Rituals & Practices"},
  {"name": "followers", "type": "textarea", "label": "Followers & Clergy"},
  {"name": "symbols", "type": "textarea", "label": "Holy Symbols & Places"}
]', true),

('Magic System', 'Systems of magic, supernatural forces, and arcane knowledge', 'sparkles', 'Magic', '[
  {"name": "name", "type": "text", "label": "System Name", "required": true},
  {"name": "type", "type": "select", "label": "Magic Type", "options": ["Arcane", "Divine", "Primal", "Elemental", "Blood", "Mind", "Spirit", "Technological", "Other"]},
  {"name": "description", "type": "textarea", "label": "Description"},
  {"name": "source", "type": "textarea", "label": "Source of Power"},
  {"name": "mechanics", "type": "textarea", "label": "How It Works"},
  {"name": "limitations", "type": "textarea", "label": "Limitations & Costs"},
  {"name": "practitioners", "type": "textarea", "label": "Who Can Use It"},
  {"name": "applications", "type": "textarea", "label": "Common Applications"}
]', true)

ON CONFLICT (name) WHERE is_system = true DO NOTHING;

-- ================================
-- STORAGE POLICIES (for file uploads)
-- ================================

-- Storage bucket policies will be set up separately in the Supabase dashboard
-- or via additional SQL commands for the 'world-assets' bucket

-- ================================
-- COMPLETION MESSAGE
-- ================================

DO $$
BEGIN
  RAISE NOTICE 'WorldWeaver database schema setup completed successfully!';
  RAISE NOTICE 'Created tables: profiles, worlds, world_members, world_invites, templates, entities, folders, relationships, activity_logs, world_files';
  RAISE NOTICE 'Applied RLS policies for all tables';
  RAISE NOTICE 'Created indexes for performance optimization';
  RAISE NOTICE 'Inserted % system templates', (SELECT COUNT(*) FROM public.templates WHERE is_system = true);
  RAISE NOTICE 'Next steps: Set up storage bucket and configure environment variables';
END $$;
```

## 🚀 After Running the Script

### 1. **Verify Schema Creation**
- Go to Supabase Dashboard → Table Editor
- Confirm all 10 tables are created
- Check that RLS is enabled on all tables

### 2. **Set Up Storage Bucket**
1. Go to Supabase Dashboard → Storage
2. Create new bucket: `world-assets`
3. Set bucket to **Private** (not public)
4. Configure storage policies for authenticated users

### 3. **Test Database Connection**
Run this test in your SQL Editor:
```sql
-- Test query to verify setup
SELECT 
  COUNT(*) as total_tables,
  (SELECT COUNT(*) FROM public.templates WHERE is_system = true) as system_templates
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%world%' OR table_name IN ('profiles', 'templates', 'entities', 'folders', 'relationships', 'activity_logs');
```

## 📋 Schema Features

✅ **10 Core Tables** with proper relationships  
✅ **Row Level Security** for multi-tenant isolation  
✅ **Performance Indexes** for fast queries  
✅ **8 System Templates** ready to use  
✅ **Automatic Triggers** for timestamps and user creation  
✅ **Comprehensive Policies** for secure data access  

Your WorldWeaver database is now ready for Phase 1 implementation! 🎯
