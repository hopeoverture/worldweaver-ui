-- WorldWeaver Database Schema
-- Core tables for the WorldWeaver application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS & AUTHENTICATION
-- =====================================================
-- Note: Supabase automatically creates auth.users table
-- We'll create a profiles table to extend user data

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- WORLDS - Core container for all content
-- =====================================================

CREATE TABLE public.worlds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- WORLD MEMBERS - User access to worlds
-- =====================================================

CREATE TYPE world_member_role AS ENUM ('viewer', 'editor', 'admin');

CREATE TABLE public.world_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role world_member_role DEFAULT 'viewer',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(world_id, user_id)
);

-- =====================================================
-- FOLDERS - Organization structure within worlds
-- =====================================================

CREATE TABLE public.folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
    parent_folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6B7280',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- TEMPLATES - Entity type definitions
-- =====================================================

CREATE TABLE public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'file-text',
    category TEXT DEFAULT 'general',
    fields JSONB NOT NULL DEFAULT '[]',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- ENTITIES - The actual content instances
-- =====================================================

CREATE TABLE public.entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
    template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
    folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- RELATIONSHIPS - Connections between entities
-- =====================================================

CREATE TABLE public.relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
    from_entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
    to_entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE NOT NULL,
    relationship_type TEXT NOT NULL DEFAULT 'related',
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CHECK (from_entity_id != to_entity_id)
);

-- =====================================================
-- WORLD BANS - User moderation
-- =====================================================

CREATE TABLE public.world_bans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE NOT NULL,
    banned_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    banned_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE(world_id, banned_user_id)
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX idx_worlds_owner_id ON public.worlds(owner_id);
CREATE INDEX idx_world_members_world_id ON public.world_members(world_id);
CREATE INDEX idx_world_members_user_id ON public.world_members(user_id);
CREATE INDEX idx_folders_world_id ON public.folders(world_id);
CREATE INDEX idx_templates_world_id ON public.templates(world_id);
CREATE INDEX idx_entities_world_id ON public.entities(world_id);
CREATE INDEX idx_relationships_world_id ON public.relationships(world_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_worlds_updated_at BEFORE UPDATE ON public.worlds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON public.folders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON public.entities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function every time a user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to auto-add world owner as admin member
CREATE OR REPLACE FUNCTION public.add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.world_members (world_id, user_id, role)
    VALUES (NEW.id, NEW.owner_id, 'admin');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically add world owner as admin member
CREATE TRIGGER on_world_created
    AFTER INSERT ON public.worlds
    FOR EACH ROW EXECUTE FUNCTION public.add_owner_as_member();

-- =====================================================
-- SYSTEM TEMPLATES
-- =====================================================

-- Insert system templates that are available across all worlds
INSERT INTO public.templates (id, world_id, name, description, icon, category, fields, is_system) VALUES
    (
        '550e8400-e29b-41d4-a716-446655440001'::UUID,
        NULL,
        'Character',
        'A person, creature, or being in your world',
        'user',
        'people',
        '[
            {"name": "appearance", "type": "textarea", "label": "Appearance", "required": false},
            {"name": "personality", "type": "textarea", "label": "Personality", "required": false},
            {"name": "background", "type": "textarea", "label": "Background", "required": false},
            {"name": "goals", "type": "textarea", "label": "Goals & Motivations", "required": false},
            {"name": "relationships", "type": "textarea", "label": "Relationships", "required": false}
        ]'::JSONB,
        TRUE
    ),
    (
        '550e8400-e29b-41d4-a716-446655440002'::UUID,
        NULL,
        'Location',
        'A place, building, or geographical feature',
        'map-pin',
        'places',
        '[
            {"name": "description", "type": "textarea", "label": "Description", "required": false},
            {"name": "geography", "type": "textarea", "label": "Geography", "required": false},
            {"name": "climate", "type": "text", "label": "Climate", "required": false},
            {"name": "population", "type": "text", "label": "Population", "required": false},
            {"name": "government", "type": "text", "label": "Government", "required": false},
            {"name": "notable_features", "type": "textarea", "label": "Notable Features", "required": false}
        ]'::JSONB,
        TRUE
    );
