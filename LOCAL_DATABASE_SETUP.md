# WorldWeaver Local Database Setup Guide

**Project:** WorldWeaver UI - Local Development Database  
**Version:** 1.0  
**Last Updated:** September 5, 2025

This guide shows you how to set up the WorldWeaver database locally using PostgreSQL for development and testing before deploying to Supabase.

## 📋 Prerequisites

- PostgreSQL 14+ installed locally
- Node.js and npm
- Basic familiarity with PostgreSQL commands

## 🔧 Step 1: Install PostgreSQL Locally

### **Windows (Recommended Method)**

#### Option A: PostgreSQL Installer
1. **Download PostgreSQL:**
   - Visit [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
   - Download PostgreSQL 15 or 16 installer
   - Run the installer as administrator

2. **Installation Setup:**
   - **Components:** Install PostgreSQL Server, pgAdmin 4, Command Line Tools
   - **Data Directory:** Use default (`C:\Program Files\PostgreSQL\16\data`)
   - **Password:** Set a strong password for `postgres` user (remember this!)
   - **Port:** Use default `5432`
   - **Locale:** Use default

3. **Verify Installation:**
   ```bash
   # Open Command Prompt or PowerShell
   psql --version
   ```

#### Option B: Using Chocolatey
```bash
# Install Chocolatey first (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install PostgreSQL
choco install postgresql
```

#### Option C: Using Docker (Recommended for Development)
```bash
# Pull PostgreSQL image
docker pull postgres:15

# Run PostgreSQL container
docker run --name worldweaver-postgres -e POSTGRES_PASSWORD=your_password -p 5432:5432 -d postgres:15

# Verify container is running
docker ps
```

### **macOS**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Or using Docker (same as Windows)
docker run --name worldweaver-postgres -e POSTGRES_PASSWORD=your_password -p 5432:5432 -d postgres:15
```

### **Linux (Ubuntu/Debian)**
```bash
# Update package list
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 🗄️ Step 2: Create WorldWeaver Database

### **Using Command Line (psql)**

1. **Connect to PostgreSQL:**
   ```bash
   # Windows (if using installer)
   psql -U postgres -h localhost

   # Docker
   docker exec -it worldweaver-postgres psql -U postgres

   # macOS/Linux
   sudo -u postgres psql
   ```

2. **Create Database and User:**
   ```sql
   -- Create the database
   CREATE DATABASE worldweaver_dev;

   -- Create a dedicated user
   CREATE USER worldweaver_user WITH PASSWORD 'your_secure_password';

   -- Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE worldweaver_dev TO worldweaver_user;

   -- Exit psql
   \q
   ```

3. **Connect to WorldWeaver Database:**
   ```bash
   psql -U worldweaver_user -d worldweaver_dev -h localhost
   ```

### **Using pgAdmin (GUI Method)**

1. **Open pgAdmin 4** (installed with PostgreSQL)
2. **Connect to Server:**
   - Right-click "Servers" → "Create" → "Server"
   - **Name:** `Local PostgreSQL`
   - **Host:** `localhost`
   - **Port:** `5432`
   - **Username:** `postgres`
   - **Password:** Your postgres password

3. **Create Database:**
   - Right-click "Databases" → "Create" → "Database"
   - **Name:** `worldweaver_dev`
   - **Owner:** `postgres`

## 📄 Step 3: Run the Database Schema

### **Local Schema Script (Modified for Local Development)**

Create `local_database_schema.sql`:

```sql
-- ================================
-- WorldWeaver Local Database Schema
-- For local development without Supabase
-- ================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- USERS TABLE (Replaces Supabase auth.users)
-- ================================

-- Local users table (simulates Supabase auth)
CREATE TABLE IF NOT EXISTS public.auth_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- For local development only
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
```

### **Run the Schema Script:**

```bash
# Method 1: Using psql command line
psql -U worldweaver_user -d worldweaver_dev -h localhost -f local_database_schema.sql

# Method 2: Copy and paste in psql interactive mode
psql -U worldweaver_user -d worldweaver_dev -h localhost
# Then paste the entire SQL script

# Method 3: Using pgAdmin
# Open pgAdmin → Connect to database → Tools → Query Tool → Paste script → Execute
```

## ⚙️ Step 4: Configure Local Environment

### **Update Environment Variables**

Create or update `.env.local` for local development:

```bash
# Local PostgreSQL Database
DATABASE_URL=postgresql://worldweaver_user:your_secure_password@localhost:5432/worldweaver_dev

# For local development, you can disable Supabase temporarily
# NEXT_PUBLIC_SUPABASE_URL=disabled
# NEXT_PUBLIC_SUPABASE_ANON_KEY=disabled

# NextAuth (still needed for authentication)
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-min
NEXTAUTH_URL=http://localhost:3000

# Local development flag
NODE_ENV=development
```

### **Install Database Driver**

```bash
cd "d:\World Deck\worldweaver-ui"

# Install PostgreSQL driver for Node.js
npm install pg
npm install -D @types/pg

# Alternative: Use Prisma for better TypeScript support
npm install prisma @prisma/client
npm install -D prisma
```

## 🔧 Step 5: Create Local Database Service

### **Option A: Direct PostgreSQL Connection**

Create `src/lib/database/local.ts`:

```typescript
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export class LocalDatabaseService {
  async query(text: string, params?: any[]) {
    const client = await pool.connect()
    try {
      const result = await client.query(text, params)
      return result
    } finally {
      client.release()
    }
  }

  // User operations
  async createUser(email: string, passwordHash?: string) {
    const result = await this.query(
      'INSERT INTO auth_users (email, password_hash) VALUES ($1, $2) RETURNING *',
      [email, passwordHash]
    )
    return result.rows[0]
  }

  async getUserByEmail(email: string) {
    const result = await this.query(
      'SELECT * FROM auth_users WHERE email = $1',
      [email]
    )
    return result.rows[0]
  }

  // World operations
  async createWorld(name: string, description: string, ownerId: string) {
    const result = await this.query(
      'INSERT INTO worlds (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, ownerId]
    )
    return result.rows[0]
  }

  async getWorldsByUser(userId: string) {
    const result = await this.query(`
      SELECT w.*, 
             COUNT(e.id) as entity_count
      FROM worlds w
      LEFT JOIN entities e ON e.world_id = w.id AND e.is_archived = false
      WHERE w.owner_id = $1 OR w.id IN (
        SELECT world_id FROM world_members WHERE user_id = $1
      )
      GROUP BY w.id
      ORDER BY w.updated_at DESC
    `, [userId])
    return result.rows
  }

  // Add more methods as needed...
}

export const localDb = new LocalDatabaseService()
```

### **Option B: Use Prisma (Recommended)**

1. **Initialize Prisma:**
   ```bash
   npx prisma init
   ```

2. **Update `prisma/schema.prisma`:**
   ```prisma
   generator client {
     provider = "prisma-client-js"
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }

   model AuthUser {
     id            String    @id @default(uuid()) @db.Uuid
     email         String    @unique
     passwordHash  String?   @map("password_hash")
     emailConfirmed Boolean  @default(false) @map("email_confirmed")
     createdAt     DateTime  @default(now()) @map("created_at")
     updatedAt     DateTime  @updatedAt @map("updated_at")
     
     profile       Profile?
     
     @@map("auth_users")
   }

   model Profile {
     id        String   @id @db.Uuid
     email     String
     fullName  String?  @map("full_name")
     avatarUrl String?  @map("avatar_url")
     username  String?  @unique
     bio       String?
     website   String?
     createdAt DateTime @default(now()) @map("created_at")
     updatedAt DateTime @updatedAt @map("updated_at")
     
     authUser  AuthUser @relation(fields: [id], references: [id], onDelete: Cascade)
     worlds    World[]  @relation("WorldOwner")
     // Add other relations...
     
     @@map("profiles")
   }

   model World {
     id          String   @id @default(uuid()) @db.Uuid
     name        String
     description String?
     coverImage  String?  @map("cover_image")
     ownerId     String   @map("owner_id") @db.Uuid
     isPublic    Boolean  @default(false) @map("is_public")
     isArchived  Boolean  @default(false) @map("is_archived")
     settings    Json     @default("{}")
     createdAt   DateTime @default(now()) @map("created_at")
     updatedAt   DateTime @updatedAt @map("updated_at")
     
     owner       Profile  @relation("WorldOwner", fields: [ownerId], references: [id], onDelete: Cascade)
     // Add other relations...
     
     @@map("worlds")
   }

   // Add other models...
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## 🧪 Step 6: Test Local Setup

### **Create Test Script**

Create `scripts/test-local-db.js`:

```javascript
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://worldweaver_user:your_password@localhost:5432/worldweaver_dev'
})

async function testConnection() {
  try {
    const client = await pool.connect()
    
    // Test basic connection
    const result = await client.query('SELECT NOW()')
    console.log('✅ Database connected successfully!')
    console.log('📅 Current time:', result.rows[0].now)
    
    // Test tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('📋 Tables found:', tables.rows.length)
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`))
    
    // Test system templates
    const templates = await client.query('SELECT COUNT(*) FROM templates WHERE is_system = true')
    console.log('🎨 System templates:', templates.rows[0].count)
    
    client.release()
    await pool.end()
    
    console.log('🎉 Local database test completed successfully!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
    process.exit(1)
  }
}

testConnection()
```

### **Run Test:**

```bash
cd "d:\World Deck\worldweaver-ui"
node scripts/test-local-db.js
```

## 🔄 Step 7: Migration Strategy

### **Development Workflow:**

1. **Develop Locally:**
   - Use local PostgreSQL for development
   - Test all features with local database
   - No API rate limits or costs

2. **Deploy to Supabase:**
   - Export local schema: `pg_dump -s worldweaver_dev > schema.sql`
   - Import to Supabase via SQL Editor
   - Update environment variables to point to Supabase

3. **Data Migration:**
   ```bash
   # Export data from local
   pg_dump --data-only worldweaver_dev > data.sql
   
   # Import to Supabase (modify as needed)
   # Run in Supabase SQL Editor
   ```

## 📋 Quick Reference

### **Common Commands:**

```bash
# Connect to local database
psql -U worldweaver_user -d worldweaver_dev -h localhost

# Backup database
pg_dump worldweaver_dev > backup.sql

# Restore database
psql -U worldweaver_user -d worldweaver_dev < backup.sql

# Reset database (careful!)
dropdb worldweaver_dev
createdb worldweaver_dev
psql -U worldweaver_user -d worldweaver_dev -f local_database_schema.sql
```

### **Connection String Format:**
```
postgresql://username:password@host:port/database
postgresql://worldweaver_user:your_password@localhost:5432/worldweaver_dev
```

## 🎯 Benefits of Local Development

✅ **Fast Development** - No network latency  
✅ **Offline Work** - Develop without internet  
✅ **Cost-Free Testing** - No API limits or costs  
✅ **Full Control** - Complete database access  
✅ **Easy Debugging** - Direct SQL access  
✅ **Version Control** - Schema changes tracked  

Your local WorldWeaver database is now ready for development! 🚀
