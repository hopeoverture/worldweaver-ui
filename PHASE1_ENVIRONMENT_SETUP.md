# Phase 1: Database & Authentication Foundation - Environment Setup Guide

**Project:** WorldWeaver UI - Phase 1 Implementation  
**Version:** 0.2.0  
**Last Updated:** September 5, 2025

This document provides step-by-step instructions for obtaining and configuring all environment variables needed for Phase 1 implementation.

## 🔑 Environment Variables Overview

Phase 1 requires the following environment variables:
- **Supabase Configuration** (Database, Auth, Real-time)
- **NextAuth Configuration** (Authentication)
- **OpenAI Configuration** (AI features - optional for Phase 1)

---

## 🗄️ Supabase Setup (Database & Backend)

### Step 1: Create Supabase Account & Project

1. **Visit Supabase Dashboard:**
   - Go to [supabase.com](https://supabase.com)
   - Click **"Start your project"** 
   - Sign up with GitHub, Google, or email

2. **Create New Project:**
   - Click **"New Project"**
   - Choose your organization (or create one)
   - Fill in project details:
     - **Name:** `worldweaver-production`
     - **Database Password:** Choose a strong password (save this!)
     - **Region:** Choose closest to your users (e.g., US East, Europe)
   - Click **"Create new project"**
   - Wait 2-3 minutes for project setup

### Step 2: Get Supabase Environment Variables

Once your project is created:

1. **Go to Project Settings:**
   - In your Supabase dashboard
   - Click the **Settings** icon (gear) in sidebar
   - Select **"API"** from the settings menu

2. **Copy the Required Values:**

   **NEXT_PUBLIC_SUPABASE_URL:**
   ```
   Found under: "Project URL"
   Example: https://abcdefghijklmnop.supabase.co
   ```

   **NEXT_PUBLIC_SUPABASE_ANON_KEY:**
   ```
   Found under: "Project API keys" → "anon public"
   Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **SUPABASE_SERVICE_ROLE_KEY:**
   ```
   Found under: "Project API keys" → "service_role" 
   ⚠️ Keep this secret! Never expose in frontend code
   Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Get Database URL:**
   - Go to **Settings** → **Database**
   - Scroll down to **"Connection string"**
   - Select **"URI"** tab
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with the password you set during project creation

   **DATABASE_URL:**
   ```
   Example: postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres
   ```

### Step 3: Configure Database Schema

1. **Open SQL Editor:**
   - In Supabase dashboard, click **"SQL Editor"** in sidebar
   - Click **"New query"**

2. **Run the Schema Creation Script:**
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

3. **Click "RUN" to execute the schema**

4. **Set up Row Level Security (RLS):**
   Create a new query and run:
   ```sql
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

   -- Basic RLS policies (more comprehensive policies will be added later)
   
   -- Profiles: Users can read and update their own profile
   CREATE POLICY "Users can view own profile" ON public.profiles
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Users can update own profile" ON public.profiles
     FOR UPDATE USING (auth.uid() = id);

   CREATE POLICY "Users can insert own profile" ON public.profiles
     FOR INSERT WITH CHECK (auth.uid() = id);

   -- Worlds: Users can see public worlds and worlds they own/are members of
   CREATE POLICY "Users can view accessible worlds" ON public.worlds
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

   CREATE POLICY "Users can update owned worlds" ON public.worlds
     FOR UPDATE USING (
       owner_id = auth.uid() OR
       EXISTS (
         SELECT 1 FROM public.world_members 
         WHERE world_id = worlds.id AND user_id = auth.uid() AND role IN ('admin')
       )
     );
   ```

### Step 4: Configure Storage Bucket

1. **Go to Storage:**
   - In Supabase dashboard, click **"Storage"** in sidebar
   - Click **"Create bucket"**

2. **Create Bucket:**
   - **Name:** `world-assets`
   - **Public bucket:** Leave unchecked (we'll handle permissions via RLS)
   - Click **"Create bucket"**

3. **Set up Storage Policies:**
   - Click on the `world-assets` bucket
   - Go to **"Policies"** tab
   - Click **"Add policy"**
   - Choose **"Custom policy"**
   - Add policy for authenticated users:
   ```sql
   CREATE POLICY "Users can upload files to their worlds" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'world-assets' AND
     auth.role() = 'authenticated' AND
     (storage.foldername(name))[1] IN (
       SELECT id::text FROM public.worlds 
       WHERE owner_id = auth.uid() OR 
       EXISTS (
         SELECT 1 FROM public.world_members 
         WHERE world_id = worlds.id AND user_id = auth.uid()
       )
     )
   );
   ```

---

## 🔐 NextAuth Setup (Authentication)

### NEXTAUTH_SECRET

This is a random string used to encrypt JWT tokens and sessions.

**Option 1: Generate Online**
1. Go to [generate-secret.vercel.app](https://generate-secret.vercel.app/32)
2. Copy the generated secret

**Option 2: Generate in Terminal**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 3: Use OpenSSL**
```bash
openssl rand -hex 32
```

**NEXTAUTH_URL**
For local development: `http://localhost:3000`
For production: Your actual domain (e.g., `https://worldweaver.com`)

### OAuth Providers Setup (Optional but Recommended)

#### Google OAuth Setup

1. **Go to Google Cloud Console:**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project or select existing one

2. **Enable Google+ API:**
   - Go to **"APIs & Services"** → **"Library"**
   - Search for **"Google+ API"**
   - Click **"Enable"**

3. **Create OAuth Credentials:**
   - Go to **"APIs & Services"** → **"Credentials"**
   - Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
   - Choose **"Web application"**
   - **Name:** `WorldWeaver`
   - **Authorized redirect URIs:** 
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)
   - Click **"Create"**

4. **Copy Credentials:**
   ```
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

#### GitHub OAuth Setup

1. **Go to GitHub Settings:**
   - Visit [github.com/settings/developers](https://github.com/settings/developers)
   - Click **"New OAuth App"**

2. **Create OAuth App:**
   - **Application name:** `WorldWeaver`
   - **Homepage URL:** `http://localhost:3000` (development)
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
   - Click **"Register application"**

3. **Generate Client Secret:**
   - Click **"Generate a new client secret"**
   - Copy both Client ID and Client Secret

4. **Add to Environment:**
   ```
   GITHUB_ID=your-github-client-id
   GITHUB_SECRET=your-github-client-secret
   ```

---

## 🧬 OpenAI Setup (Optional for Phase 1)

### Get OpenAI API Key

1. **Visit OpenAI Platform:**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Sign up or log in

2. **Create API Key:**
   - Go to **"API Keys"** in your dashboard
   - Click **"Create new secret key"**
   - **Name:** `WorldWeaver Development`
   - Copy the API key immediately (you won't see it again!)

3. **Add to Environment:**
   ```
   OPENAI_API_KEY=sk-...your-openai-api-key
   ```

**Note:** OpenAI API usage is paid. Start with a small credit allocation for testing.

---

## 📝 Complete .env.local Configuration

Create or update your `.env.local` file with all the values:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database
DATABASE_URL=postgresql://postgres:your-password@db.abcdefghijklmnop.supabase.co:5432/postgres

# NextAuth Configuration
NEXTAUTH_SECRET=your-generated-32-character-secret
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# OpenAI (Optional for Phase 1)
OPENAI_API_KEY=sk-your-openai-api-key

# Email Configuration (Optional)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@example.com
EMAIL_SERVER_PASSWORD=your-email-password
EMAIL_FROM=noreply@worldweaver.com
```

---

## 🔧 Installation Commands

Run these commands in your project directory:

```bash
# Install core dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install next-auth @auth/supabase-adapter
npm install uuid bcryptjs
npm install -D @types/uuid @types/bcryptjs

# Install optional AI dependencies (for future phases)
npm install openai ai

# Verify installation
npm list @supabase/supabase-js next-auth
```

---

## ✅ Verification Steps

### 1. Test Supabase Connection

Create a test file `test-supabase.js`:
```javascript
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testConnection() {
  try {
    const { data, error } = await supabase.from('profiles').select('count')
    if (error) throw error
    console.log('✅ Supabase connection successful!')
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message)
  }
}

testConnection()
```

Run: `node test-supabase.js`

### 2. Test Authentication

Start your development server and visit:
- `http://localhost:3000/api/auth/signin` - Should show sign-in page
- No errors in browser console

### 3. Database Tables

In Supabase dashboard:
- Go to **"Table Editor"**
- Verify all tables are created
- Check RLS policies are enabled

---

## 🚨 Security Checklist

- [ ] **Never commit `.env.local`** to version control
- [ ] **Add `.env.local` to `.gitignore`**
- [ ] **Use environment-specific URLs** (localhost for dev, domain for prod)
- [ ] **Regenerate secrets** for production deployment
- [ ] **Enable RLS** on all database tables
- [ ] **Set up proper OAuth redirect URLs** for each environment

---

## 🆘 Troubleshooting

### Common Issues

**Issue: "Invalid API key" from Supabase**
- Verify you're using the correct project URL
- Check that anon key matches your project
- Ensure no extra spaces in environment variables

**Issue: NextAuth callback errors**
- Verify OAuth redirect URLs match exactly
- Check that NEXTAUTH_URL matches your current domain
- Ensure NEXTAUTH_SECRET is set and at least 32 characters

**Issue: Database connection fails**
- Verify database password is correct
- Check that DATABASE_URL format is correct
- Ensure your IP is not blocked by Supabase

**Issue: "relation does not exist" database errors**
- Verify all SQL schema scripts ran successfully
- Check table names match exactly
- Run schema scripts in correct order

### Getting Help

- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **NextAuth Docs:** [next-auth.js.org](https://next-auth.js.org)
- **GitHub Issues:** Create issues in your repository

---

## 📞 Next Steps

Once you have all environment variables configured:

1. **Install dependencies** (commands above)
2. **Test connections** (verification steps)
3. **Start development server:** `npm run dev`
4. **Begin Phase 1 implementation** with Supabase integration

Your Phase 1 foundation will be ready for building the complete authentication and database layer! 🚀

---

**Environment setup complete? Let's start building the database integration!** ✨
