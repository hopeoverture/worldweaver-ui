# WorldWeaver UI - Complete Development Roadmap

**Project:** WorldWeaver UI - Sophisticated World-Building Application  
**Version:** 0.2.0 Development Roadmap  
**Last Updated:** September 5, 2025

This comprehensive guide outlines the complete development path for transforming WorldWeaver from a prototype into a full-featured, production-ready application with database persistence, AI integration, user authentication, and advanced collaboration features.

## 📋 Current State Assessment

### ✅ **Completed Features (v0.1.0)**
- Complete Next.js 15.5.2 + React 19.1.0 + TypeScript setup
- 18 comprehensive entity templates (Character, Location, Object, etc.)
- Advanced UI with Tailwind CSS 4.1.13 and hover effects
- Zustand state management with mock data
- World membership and collaboration system (UI only)
- Profile management interface
- Responsive design with dark mode support

### 🚧 **Current Limitations**
- **No Data Persistence:** All data stored in memory (lost on refresh)
- **No User Authentication:** Mock user system
- **No Real-time Collaboration:** UI mockups only
- **No AI Integration:** Manual content creation only
- **No File Management:** No image/asset upload
- **No Advanced Search:** Basic filtering only
- **No Analytics:** No usage tracking or insights

## 🎯 Development Phases Overview

### **Phase 1: Database & Authentication Foundation** (4-6 weeks)
- PostgreSQL database setup with Prisma ORM
- Supabase integration for backend services
- NextAuth.js authentication system
- User management and profiles
- Data migration from mock to real data

### **Phase 2: Core Feature Enhancement** (6-8 weeks)
- Real-time collaboration with WebSockets
- File upload and asset management
- Advanced search and filtering
- Import/export functionality
- Backup and version control

### **Phase 3: AI Integration** (4-6 weeks)
- OpenAI GPT integration for content generation
- AI-powered entity suggestions
- Smart relationship detection
- Content enhancement and editing assistance

### **Phase 4: Advanced Features** (6-8 weeks)
- Analytics dashboard and insights
- Advanced workflow management
- Team collaboration tools
- API development for third-party integrations
- Mobile application development

### **Phase 5: Production & Scaling** (4-6 weeks)
- Performance optimization
- Security hardening
- Monitoring and logging
- CI/CD pipeline enhancement
- Documentation and user guides

---

## 🗄️ Phase 1: Database & Authentication Foundation

### Step 1.1: Database Setup with Supabase

**Why Supabase:** Real-time subscriptions, built-in auth, file storage, edge functions, PostgreSQL with excellent Next.js integration.

#### Install Dependencies
```bash
cd "d:\World Deck\worldweaver-ui"
npm install @supabase/supabase-js @supabase/ssr
npm install -D @types/uuid uuid
```

#### Create Supabase Project
1. Visit [supabase.com](https://supabase.com) and create account
2. Create new project: `worldweaver-production`
3. Note your project URL and anon key
4. Create `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=your-database-url

# Note: Legacy NextAuth Section
# The application now uses Supabase Auth. The following NextAuth content is kept for historical reference and is no longer the recommended path.
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
```

#### Setup Supabase Client
Create `src/lib/supabase/browser.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

Create `src/lib/supabase/server.ts`:
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

### Step 1.2: Database Schema Design

#### Core Tables SQL Schema
Create and run in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
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
CREATE TABLE public.worlds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  owner_id UUID REFERENCES public.profiles(id) NOT NULL,
  is_public BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- World members table
CREATE TABLE public.world_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  permissions JSONB DEFAULT '{}',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(world_id, user_id)
);

-- World invites table
CREATE TABLE public.world_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  invited_by UUID REFERENCES public.profiles(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates table
CREATE TABLE public.templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  is_system BOOLEAN DEFAULT false,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Entities table
CREATE TABLE public.entities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES public.templates(id),
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.folders(id),
  data JSONB DEFAULT '{}',
  image_url TEXT,
  tags TEXT[],
  is_archived BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Folders table
CREATE TABLE public.folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.folders(id),
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE,
  color TEXT DEFAULT 'blue',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relationships table
CREATE TABLE public.relationships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  to_entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  description TEXT,
  strength INTEGER DEFAULT 5 CHECK (strength >= 1 AND strength <= 10),
  is_bidirectional BOOLEAN DEFAULT false,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_entity_id, to_entity_id, relationship_type)
);

-- Activity log table
CREATE TABLE public.activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File storage table
CREATE TABLE public.world_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  world_id UUID REFERENCES public.worlds(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Row Level Security (RLS) Policies
```sql
-- Enable RLS
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

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Worlds policies
CREATE POLICY "Users can view worlds they have access to" ON public.worlds
  FOR SELECT USING (
    is_public = true OR 
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.world_members 
      WHERE world_id = worlds.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create worlds" ON public.worlds
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "World owners can update their worlds" ON public.worlds
  FOR UPDATE USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.world_members 
      WHERE world_id = worlds.id AND user_id = auth.uid() AND role IN ('admin')
    )
  );

-- Add similar policies for other tables...
```

### Step 1.3: Authentication Setup with NextAuth.js

#### Install NextAuth Dependencies
```bash
npm install next-auth @auth/supabase-adapter
npm install -D @types/bcryptjs bcryptjs
```

#### Configure NextAuth
Create `src/lib/auth.ts`:
```typescript
import { NextAuthOptions } from "next-auth"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import EmailProvider from "next-auth/providers/email"
import { supabase } from "./supabase/browser"

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}
```

#### Create API Route
Create `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

### Step 1.4: Update Type Definitions

Prefer generated types: `src/lib/supabase/types.generated.ts` (re-exported by `src/lib/supabase/types.ts`).
If you need a local scaffold, you may stub a minimal Database interface temporarily, but the canonical source is generated from Supabase.
```typescript
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          username: string | null
          bio: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          bio?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          bio?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      worlds: {
        Row: {
          id: string
          name: string
          description: string | null
          cover_image: string | null
          owner_id: string
          is_public: boolean
          is_archived: boolean
          settings: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          cover_image?: string | null
          owner_id: string
          is_public?: boolean
          is_archived?: boolean
          settings?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          cover_image?: string | null
          owner_id?: string
          is_public?: boolean
          is_archived?: boolean
          settings?: any
          created_at?: string
          updated_at?: string
        }
      }
      // Add other table types...
    }
  }
}
```

### Step 1.5: Data Layer Migration

#### Create Database Service Layer
Create `src/lib/services/database.ts`:
```typescript
import { supabase } from '@/lib/supabase/browser'
import { Database } from '@/lib/supabase/types'

export class DatabaseService {
  // World operations
  async createWorld(world: Database['public']['Tables']['worlds']['Insert']) {
    const { data, error } = await supabase
      .from('worlds')
      .insert(world)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getWorldsByUser(userId: string) {
    const { data, error } = await supabase
      .from('worlds')
      .select(`
        *,
        world_members!inner(role),
        entities(count)
      `)
      .or(`owner_id.eq.${userId},world_members.user_id.eq.${userId}`)
      .eq('is_archived', false)

    if (error) throw error
    return data
  }

  async getWorldById(worldId: string, userId: string) {
    const { data, error } = await supabase
      .from('worlds')
      .select(`
        *,
        world_members(role, user_id),
        entities(count),
        templates(count)
      `)
      .eq('id', worldId)
      .single()

    if (error) throw error

    // Check user access
    const hasAccess = data.is_public || 
                     data.owner_id === userId ||
                     data.world_members.some(member => member.user_id === userId)

    if (!hasAccess) {
      throw new Error('Access denied')
    }

    return data
  }

  // Entity operations
  async createEntity(entity: Database['public']['Tables']['entities']['Insert']) {
    const { data, error } = await supabase
      .from('entities')
      .insert(entity)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getEntitiesByWorld(worldId: string) {
    const { data, error } = await supabase
      .from('entities')
      .select(`
        *,
        template:templates(*),
        folder:folders(*)
      `)
      .eq('world_id', worldId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Add more service methods...
}

export const db = new DatabaseService()
```

---

## 🤝 Phase 2: Real-time Collaboration & File Management

### Step 2.1: Real-time Features with Supabase Realtime

#### Setup Realtime Subscriptions
Create `src/lib/hooks/useRealtime.ts`:
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/browser'
import { useAuthStore } from '@/lib/store'

export function useRealtimeEntities(worldId: string) {
  const [entities, setEntities] = useState([])
  const user = useAuthStore(state => state.user)

  useEffect(() => {
    if (!worldId || !user) return

    // Subscribe to entity changes
    const channel = supabase
      .channel(`entities:${worldId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'entities',
          filter: `world_id=eq.${worldId}`,
        },
        (payload) => {
          console.log('Entity change:', payload)
          
          switch (payload.eventType) {
            case 'INSERT':
              setEntities(prev => [payload.new, ...prev])
              break
            case 'UPDATE':
              setEntities(prev => 
                prev.map(entity => 
                  entity.id === payload.new.id ? payload.new : entity
                )
              )
              break
            case 'DELETE':
              setEntities(prev => 
                prev.filter(entity => entity.id !== payload.old.id)
              )
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [worldId, user])

  return entities
}

export function useRealtimeCollaborators(worldId: string) {
  const [activeUsers, setActiveUsers] = useState([])

  useEffect(() => {
    if (!worldId) return

    const channel = supabase.channel(`collaborators:${worldId}`)

    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        setActiveUsers(Object.values(newState).flat())
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Send user presence
          await channel.track({
            user_id: user?.id,
            username: user?.username,
            avatar_url: user?.avatar_url,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [worldId])

  return activeUsers
}
```

### Step 2.2: File Upload and Asset Management

#### Setup Supabase Storage
Create storage bucket in Supabase dashboard:
- Bucket name: `world-assets`
- Public: `false`
- Allowed MIME types: `image/*,application/pdf,text/*`

#### Create File Upload Hook
Create `src/lib/hooks/useFileUpload.ts`:
```typescript
import { useState } from 'react'
import { supabase } from '@/lib/supabase/browser'
import { v4 as uuidv4 } from 'uuid'

export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const uploadFile = async (file: File, worldId: string, folder = 'general') => {
    setUploading(true)
    setProgress(0)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${worldId}/${folder}/${fileName}`

      const { data, error } = await supabase.storage
        .from('world-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            setProgress((progress.loaded / progress.total) * 100)
          },
        })

      if (error) throw error

      // Save file record to database
      const { data: fileRecord, error: dbError } = await supabase
        .from('world_files')
        .insert({
          world_id: worldId,
          file_name: file.name,
          file_path: data.path,
          file_size: file.size,
          mime_type: file.type,
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('world-assets')
        .getPublicUrl(data.path)

      return {
        ...fileRecord,
        public_url: urlData.publicUrl,
      }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const deleteFile = async (filePath: string, fileId: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('world-assets')
        .remove([filePath])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('world_files')
        .delete()
        .eq('id', fileId)

      if (dbError) throw dbError
    } catch (error) {
      console.error('Delete error:', error)
      throw error
    }
  }

  return {
    uploadFile,
    deleteFile,
    uploading,
    progress,
  }
}
```

### Step 2.3: Advanced Search and Filtering

#### Create Search Service
Create `src/lib/services/search.ts`:
```typescript
import { supabase } from '@/lib/supabase/browser'

export class SearchService {
  async searchEntities(worldId: string, query: string, filters: SearchFilters = {}) {
    let queryBuilder = supabase
      .from('entities')
      .select(`
        *,
        template:templates(*),
        folder:folders(*)
      `)
      .eq('world_id', worldId)
      .eq('is_archived', false)

    // Full-text search
    if (query) {
      queryBuilder = queryBuilder.or(
        `name.ilike.%${query}%,description.ilike.%${query}%,data->>'content'.ilike.%${query}%`
      )
    }

    // Template filter
    if (filters.templateIds?.length) {
      queryBuilder = queryBuilder.in('template_id', filters.templateIds)
    }

    // Folder filter
    if (filters.folderIds?.length) {
      queryBuilder = queryBuilder.in('folder_id', filters.folderIds)
    }

    // Tags filter
    if (filters.tags?.length) {
      queryBuilder = queryBuilder.overlaps('tags', filters.tags)
    }

    // Date range filter
    if (filters.dateFrom) {
      queryBuilder = queryBuilder.gte('created_at', filters.dateFrom)
    }
    if (filters.dateTo) {
      queryBuilder = queryBuilder.lte('created_at', filters.dateTo)
    }

    // Sorting
    const sortColumn = filters.sortBy || 'created_at'
    const sortOrder = filters.sortOrder || 'desc'
    queryBuilder = queryBuilder.order(sortColumn, { ascending: sortOrder === 'asc' })

    const { data, error } = await queryBuilder

    if (error) throw error
    return data
  }

  async getSearchSuggestions(worldId: string, query: string) {
    const { data, error } = await supabase
      .from('entities')
      .select('name, tags')
      .eq('world_id', worldId)
      .ilike('name', `%${query}%`)
      .limit(10)

    if (error) throw error

    // Extract unique suggestions
    const suggestions = new Set<string>()
    data.forEach(entity => {
      if (entity.name.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(entity.name)
      }
      entity.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(tag)
        }
      })
    })

    return Array.from(suggestions).slice(0, 5)
  }
}

interface SearchFilters {
  templateIds?: string[]
  folderIds?: string[]
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const searchService = new SearchService()
```

---

## 🤖 Phase 3: AI Integration

### Step 3.1: OpenAI Setup and Configuration

#### Install AI Dependencies
```bash
npm install openai ai
npm install -D @types/openai
```

#### Configure OpenAI Service
Create `src/lib/services/ai.ts`:
```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export class AIService {
  async generateEntityContent(template: any, context: any, userPrompt?: string) {
    const systemPrompt = `You are an expert world-building assistant. Generate detailed, creative content for ${template.name} entities. 

Template fields: ${JSON.stringify(template.fields)}
World context: ${JSON.stringify(context)}

Create content that is:
- Internally consistent with the world
- Rich in detail and imagination
- Appropriate for the template type
- Engaging and memorable

Return a JSON object with values for each template field.`

    const userMessage = userPrompt || `Create a new ${template.name} for this world.`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
      })

      const content = completion.choices[0].message.content
      if (!content) throw new Error('No content generated')

      return JSON.parse(content)
    } catch (error) {
      console.error('AI generation error:', error)
      throw error
    }
  }

  async suggestRelationships(entity: any, worldEntities: any[]) {
    const systemPrompt = `Analyze the given entity and suggest meaningful relationships with other entities in the world. 

Entity: ${JSON.stringify(entity)}
Other entities: ${JSON.stringify(worldEntities.slice(0, 20))} // Limit for context

Suggest 3-5 potential relationships with:
- Relationship type (e.g., "allies", "enemies", "family", "location", "owns")
- Target entity
- Brief explanation
- Relationship strength (1-10)

Return as JSON array.`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      })

      const content = completion.choices[0].message.content
      if (!content) throw new Error('No suggestions generated')

      return JSON.parse(content)
    } catch (error) {
      console.error('AI relationship suggestion error:', error)
      throw error
    }
  }

  async enhanceEntityContent(entity: any, enhancementType: 'expand' | 'refine' | 'creative') {
    const prompts = {
      expand: 'Expand and add more detail to this entity while maintaining consistency.',
      refine: 'Refine and improve the quality of this entity description.',
      creative: 'Add creative and interesting details to make this entity more engaging.',
    }

    const systemPrompt = `${prompts[enhancementType]}

Original entity: ${JSON.stringify(entity)}

Enhance the content while:
- Keeping the core identity unchanged
- Adding depth and richness
- Maintaining internal consistency
- Making it more engaging

Return the enhanced entity as JSON.`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: enhancementType === 'creative' ? 0.9 : 0.7,
      })

      const content = completion.choices[0].message.content
      if (!content) throw new Error('No enhancement generated')

      return JSON.parse(content)
    } catch (error) {
      console.error('AI enhancement error:', error)
      throw error
    }
  }

  async generateWorldSummary(world: any, entities: any[]) {
    const systemPrompt = `Create a comprehensive summary of this world based on its entities and content.

World: ${JSON.stringify(world)}
Entities: ${JSON.stringify(entities.slice(0, 50))} // Sample of entities

Generate:
- Overview of the world
- Key themes and elements
- Notable locations and characters
- World tone and atmosphere
- Interesting connections and patterns

Return as structured JSON with sections.`

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.6,
      })

      const content = completion.choices[0].message.content
      if (!content) throw new Error('No summary generated')

      return JSON.parse(content)
    } catch (error) {
      console.error('AI summary error:', error)
      throw error
    }
  }
}

export const aiService = new AIService()
```

### Step 3.2: AI-Powered Entity Creation

#### Create AI Entity Modal
Create `src/components/ai/AIEntityModal.tsx`:
```typescript
'use client'
import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { aiService } from '@/lib/services/ai'

interface AIEntityModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (entityData: any) => void
  templates: any[]
  worldContext: any
}

export function AIEntityModal({ 
  isOpen, 
  onClose, 
  onGenerate, 
  templates, 
  worldContext 
}: AIEntityModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState(null)

  const handleGenerate = async () => {
    if (!selectedTemplate) return

    setGenerating(true)
    try {
      const template = templates.find(t => t.id === selectedTemplate)
      const content = await aiService.generateEntityContent(
        template,
        worldContext,
        prompt
      )
      setGeneratedContent(content)
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleAccept = () => {
    if (generatedContent) {
      const template = templates.find(t => t.id === selectedTemplate)
      onGenerate({
        name: generatedContent.name || `New ${template.name}`,
        template_id: selectedTemplate,
        data: generatedContent,
      })
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Entity Generator">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Template Type
          </label>
          <Select
            value={selectedTemplate}
            onChange={setSelectedTemplate}
            options={templates.map(t => ({
              value: t.id,
              label: t.name,
            }))}
            placeholder="Select a template..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description (Optional)
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to create... (e.g., 'A mysterious tavern keeper with a secret past')"
            rows={3}
          />
        </div>

        {generatedContent && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Generated Content:</h4>
            <pre className="text-sm overflow-auto max-h-40">
              {JSON.stringify(generatedContent, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!selectedTemplate || generating}
          >
            {generating ? (
              <>
                <Spinner className="w-4 h-4 mr-2" />
                Generating...
              </>
            ) : (
              'Generate'
            )}
          </Button>
          {generatedContent && (
            <Button onClick={handleAccept}>
              Accept & Create
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
```

### Step 3.3: AI API Routes

#### Create AI API Endpoints
Create `src/app/api/ai/generate/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { aiService } from '@/lib/services/ai'
import { db } from '@/lib/services/database'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { worldId, templateId, prompt, type } = await request.json()

    // Verify user has access to world
    const world = await db.getWorldById(worldId, session.user.id)
    if (!world) {
      return NextResponse.json({ error: 'World not found' }, { status: 404 })
    }

    // Get template and world context
    const template = await db.getTemplateById(templateId)
    const entities = await db.getEntitiesByWorld(worldId)
    
    const worldContext = {
      world: { name: world.name, description: world.description },
      existingEntities: entities.slice(0, 10), // Sample for context
    }

    let result
    switch (type) {
      case 'entity':
        result = await aiService.generateEntityContent(template, worldContext, prompt)
        break
      case 'relationships':
        result = await aiService.suggestRelationships(prompt.entity, entities)
        break
      case 'enhance':
        result = await aiService.enhanceEntityContent(prompt.entity, prompt.enhancementType)
        break
      default:
        return NextResponse.json({ error: 'Invalid generation type' }, { status: 400 })
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    )
  }
}
```

---

## 📊 Phase 4: Analytics & Advanced Features

### Step 4.1: Analytics Dashboard

#### Install Analytics Dependencies
```bash
npm install recharts date-fns
npm install -D @types/recharts
```

#### Create Analytics Service
Create `src/lib/services/analytics.ts`:
```typescript
import { supabase } from '@/lib/supabase/browser'

export class AnalyticsService {
  async getWorldStats(worldId: string, timeRange = '30d') {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(timeRange))

    // Get entity creation over time
    const { data: entityStats } = await supabase
      .from('entities')
      .select('created_at, template_id')
      .eq('world_id', worldId)
      .gte('created_at', startDate.toISOString())

    // Get activity logs
    const { data: activityStats } = await supabase
      .from('activity_logs')
      .select('created_at, action, user_id')
      .eq('world_id', worldId)
      .gte('created_at', startDate.toISOString())

    // Get collaborator activity
    const { data: collaboratorStats } = await supabase
      .from('world_members')
      .select('user_id, joined_at, profiles(full_name)')
      .eq('world_id', worldId)

    return {
      entityCreation: this.groupByDate(entityStats || []),
      activityTimeline: this.groupByDate(activityStats || []),
      collaborators: collaboratorStats || [],
      totalEntities: entityStats?.length || 0,
      totalActivity: activityStats?.length || 0,
    }
  }

  async getTemplateUsage(worldId: string) {
    const { data } = await supabase
      .from('entities')
      .select(`
        template_id,
        templates(name, icon)
      `)
      .eq('world_id', worldId)

    const usage = {}
    data?.forEach(entity => {
      const templateName = entity.templates?.name || 'Unknown'
      usage[templateName] = (usage[templateName] || 0) + 1
    })

    return Object.entries(usage).map(([name, count]) => ({
      name,
      count,
    }))
  }

  async getRelationshipAnalysis(worldId: string) {
    const { data } = await supabase
      .from('relationships')
      .select(`
        relationship_type,
        strength,
        from_entity_id,
        to_entity_id
      `)
      .eq('world_id', worldId)

    const typeDistribution = {}
    const strengthDistribution = {}
    
    data?.forEach(rel => {
      typeDistribution[rel.relationship_type] = (typeDistribution[rel.relationship_type] || 0) + 1
      strengthDistribution[rel.strength] = (strengthDistribution[rel.strength] || 0) + 1
    })

    return {
      typeDistribution,
      strengthDistribution,
      totalRelationships: data?.length || 0,
    }
  }

  private groupByDate(data: any[]) {
    const grouped = {}
    data.forEach(item => {
      const date = new Date(item.created_at).toDateString()
      grouped[date] = (grouped[date] || 0) + 1
    })
    return Object.entries(grouped).map(([date, count]) => ({
      date,
      count,
    }))
  }
}

export const analyticsService = new AnalyticsService()
```

### Step 4.2: Advanced Workflow Management

#### Create Workflow System
Create `src/lib/services/workflow.ts`:
```typescript
export interface WorkflowStep {
  id: string
  name: string
  description: string
  type: 'create' | 'review' | 'approve' | 'publish'
  assignedTo?: string
  dueDate?: Date
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  dependencies: string[]
}

export interface Workflow {
  id: string
  name: string
  description: string
  worldId: string
  steps: WorkflowStep[]
  createdBy: string
  createdAt: Date
  status: 'active' | 'paused' | 'completed'
}

export class WorkflowService {
  async createWorkflow(workflow: Omit<Workflow, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('workflows')
      .insert({
        ...workflow,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateStepStatus(stepId: string, status: WorkflowStep['status']) {
    const { data, error } = await supabase
      .from('workflow_steps')
      .update({ status })
      .eq('id', stepId)
      .select()
      .single()

    if (error) throw error

    // Check if all steps are completed
    await this.checkWorkflowCompletion(data.workflow_id)
    
    return data
  }

  async getWorkflowsByWorld(worldId: string) {
    const { data, error } = await supabase
      .from('workflows')
      .select(`
        *,
        steps:workflow_steps(*),
        created_by_profile:profiles(*)
      `)
      .eq('world_id', worldId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  private async checkWorkflowCompletion(workflowId: string) {
    const { data: steps } = await supabase
      .from('workflow_steps')
      .select('status')
      .eq('workflow_id', workflowId)

    const allCompleted = steps?.every(step => step.status === 'completed')
    
    if (allCompleted) {
      await supabase
        .from('workflows')
        .update({ status: 'completed' })
        .eq('id', workflowId)
    }
  }
}

export const workflowService = new WorkflowService()
```

---

## 🚀 Phase 5: Production & Scaling

### Step 5.1: Performance Optimization

#### Implement Caching Strategy
Create `src/lib/cache.ts`:
```typescript
import { unstable_cache } from 'next/cache'

export const getCachedWorld = unstable_cache(
  async (worldId: string, userId: string) => {
    return await db.getWorldById(worldId, userId)
  },
  ['world'],
  { revalidate: 300 } // 5 minutes
)

export const getCachedEntities = unstable_cache(
  async (worldId: string) => {
    return await db.getEntitiesByWorld(worldId)
  },
  ['entities'],
  { revalidate: 60 } // 1 minute
)
```

#### Add Image Optimization
Create `src/lib/image.ts`:
```typescript
export function getOptimizedImageUrl(url: string, width?: number, quality = 80) {
  if (!url) return '/placeholder-image.jpg'
  
  // For Supabase storage URLs
  if (url.includes('supabase')) {
    const params = new URLSearchParams()
    if (width) params.set('width', width.toString())
    params.set('quality', quality.toString())
    return `${url}?${params.toString()}`
  }
  
  return url
}
```

### Step 5.2: Security Hardening

#### Implement Rate Limiting
Create `src/lib/rate-limit.ts`:
```typescript
import { NextRequest } from 'next/server'

const rateLimitMap = new Map()

export function rateLimit(request: NextRequest, limit = 60, window = 60000) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous'
  const now = Date.now()
  const windowStart = now - window

  const requestLog = rateLimitMap.get(ip) || []
  const requestsInWindow = requestLog.filter((time: number) => time > windowStart)

  if (requestsInWindow.length >= limit) {
    return false
  }

  requestsInWindow.push(now)
  rateLimitMap.set(ip, requestsInWindow)
  return true
}
```

#### Add Input Validation
Create `src/lib/validation.ts`:
```typescript
import { z } from 'zod'

export const worldSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  is_public: z.boolean().default(false),
})

export const entitySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  template_id: z.string().uuid(),
  world_id: z.string().uuid(),
  data: z.record(z.any()),
  tags: z.array(z.string()).max(20).optional(),
})

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`)
  }
  return result.data
}
```

### Step 5.3: Monitoring and Logging

#### Setup Error Tracking with Sentry
```bash
npm install @sentry/nextjs
```

Create `src/lib/monitoring.ts`:
```typescript
import * as Sentry from '@sentry/nextjs'

export function initializeMonitoring() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  })
}

export function logError(error: Error, context?: any) {
  console.error('Application error:', error, context)
  Sentry.captureException(error, { extra: context })
}

export function logActivity(action: string, details: any) {
  console.log(`Activity: ${action}`, details)
  
  // Send to analytics service
  if (typeof window !== 'undefined') {
    // Client-side analytics
    gtag('event', action, details)
  }
}
```

---

## 📱 Mobile Application Development

### Step 6.1: React Native Setup (Optional)

#### Initialize React Native Project
```bash
npx create-expo-app worldweaver-mobile --template
cd worldweaver-mobile
npm install @supabase/supabase-js
npm install @react-navigation/native @react-navigation/stack
```

#### Shared API Layer
Create shared services that work across web and mobile platforms.

---

## 📋 Implementation Timeline

### **Month 1-2: Foundation**
- [ ] Database schema implementation
- [ ] Authentication setup
- [ ] Basic CRUD operations
- [ ] Data migration from mock to real data
- [ ] User profile management

### **Month 3-4: Core Features**
- [ ] Real-time collaboration
- [ ] File upload and management
- [ ] Advanced search implementation
- [ ] Import/export functionality
- [ ] Basic analytics

### **Month 5-6: AI Integration**
- [ ] OpenAI service setup
- [ ] AI entity generation
- [ ] Relationship suggestions
- [ ] Content enhancement features
- [ ] AI-powered insights

### **Month 7-8: Advanced Features**
- [ ] Workflow management
- [ ] Advanced analytics dashboard
- [ ] Team collaboration tools
- [ ] API development
- [ ] Third-party integrations

### **Month 9-10: Production Ready**
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Comprehensive testing
- [ ] Monitoring implementation
- [ ] Documentation completion

---

## 🎯 Success Metrics

### **Technical Metrics**
- ⚡ Page load time < 2 seconds
- 📊 Database query response < 100ms
- 🔄 Real-time sync latency < 500ms
- 📈 99.9% uptime
- 🛡️ Zero security vulnerabilities

### **User Metrics**
- 👥 User retention rate > 80%
- ⏱️ Average session time > 30 minutes
- 📝 Entities created per user > 50
- 🤝 Collaboration engagement > 60%
- ⭐ User satisfaction score > 4.5/5

---

## 📞 Next Steps

1. **Phase 1 Kickoff:** Start with database setup and authentication
2. **Team Assembly:** Consider hiring additional developers for faster progress
3. **User Research:** Conduct user interviews to validate features
4. **Beta Testing:** Launch closed beta with select users
5. **Market Validation:** Gather feedback and iterate

---

**Ready to build the future of world-building? Let's start with Phase 1! 🚀**
