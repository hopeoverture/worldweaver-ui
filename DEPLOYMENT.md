# WorldWeaver Deployment Guide

This document provides all common commands and workflows for updating changes to the WorldWeaver app and deploying to production.

## Table of Contents
- [Development Commands](#development-commands)
- [Database Operations](#database-operations)
- [Git & Deployment Workflow](#git--deployment-workflow)
- [Testing & Validation](#testing--validation)
- [Troubleshooting](#troubleshooting)
- [Environment Management](#environment-management)

---

## Development Commands

### Starting Development Server
```bash
# Start development server with auto port cleanup
npm run dev

# Clean development with explicit port cleanup
npm run dev:clean

# Full development stack (server + auto-seed templates)
npm run dev:all

# Manual port cleanup when needed
npm run kill-ports
```

### Build Commands
```bash
# Build production version
npm run build

# Start production server locally
npm run start

# Type checking without building
npx tsc --noEmit --skipLibCheck
```

---

## Database Operations

### Migration Management
```bash
# Apply new migrations to remote database
cd supabase && npx supabase db push

# Apply migrations including older ones
cd supabase && npx supabase db push --include-all

# Generate TypeScript types from database
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/lib/supabase/types.generated.ts
```

### Database Development
```bash
# Start local Supabase (if using local development)
npx supabase start

# Stop local Supabase
npx supabase stop

# Reset local database
npx supabase db reset
```

---

## Git & Deployment Workflow

### Standard Deployment Process
```bash
# 1. Check current status
git status
git diff --name-only

# 2. Stage changes
git add [files]
# or add all changes
git add .

# 3. Commit with descriptive message
git commit -m "Your descriptive commit message

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 4. Push to remote
git push origin main

# 5. Create deployment tag for Vercel
git tag -a v$(date +%Y%m%d-%H%M%S)-feature-name -m "Vercel deployment: Description"
git push origin --tags
```

### Quick Deploy Commands
```bash
# One-liner for quick deployment (use carefully)
git add . && git commit -m "Quick update" && git push origin main

# Deploy with automatic tag
git push origin main && git tag -a v$(date +%Y%m%d-%H%M%S) -m "Auto deployment" && git push origin --tags
```

### Branch Management
```bash
# Create and switch to new feature branch
git checkout -b feature/your-feature-name

# Switch back to main
git checkout main

# Merge feature branch
git merge feature/your-feature-name

# Delete feature branch after merge
git branch -d feature/your-feature-name
```

---

## Testing & Validation

### Code Quality Checks
```bash
# Run TypeScript compilation check
npx tsc --noEmit --skipLibCheck

# Run ESLint
npm run lint

# Run tests
npm run test

# Run API endpoint tests
npm run test:api
```

### MCP Integration Testing
```bash
# Test MCP server configuration
npm run test:mcp
```

---

## Common Deployment Scenarios

### 1. Feature Development
```bash
# Start development
npm run dev

# Make changes...
# Test locally...

# Deploy when ready
git add .
git commit -m "Add new feature: [description]

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main
git tag -a v$(date +%Y%m%d-%H%M%S)-feature -m "Vercel deployment: New feature"
git push origin --tags
```

### 2. Database Schema Changes
```bash
# 1. Create migration file in supabase/migrations/
# 2. Test migration locally
cd supabase && npx supabase db push

# 3. Update types if needed
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/lib/supabase/types.generated.ts

# 4. Commit and deploy
git add .
git commit -m "Add database migration: [description]"
git push origin main
git tag -a v$(date +%Y%m%d-%H%M%S)-db-update -m "Database schema update"
git push origin --tags
```

### 3. Bug Fixes
```bash
# Fix the bug...
# Test the fix...

git add .
git commit -m "Fix: [brief description of bug fixed]

- Describe what was broken
- Describe what was changed
- Any additional context

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main
git tag -a v$(date +%Y%m%d-%H%M%S)-hotfix -m "Hotfix: [description]"
git push origin --tags
```

### 4. UI/UX Updates
```bash
# Make UI changes...
# Test in browser...

git add .
git commit -m "UI: [description of changes]

- List specific UI changes
- Mention any new components
- Note responsive design considerations

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main
git tag -a v$(date +%Y%m%d-%H%M%S)-ui-update -m "UI improvements"
git push origin --tags
```

---

## Environment Management

### Environment Variables
Required environment variables in `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional Development
SEED_ADMIN_TOKEN=random_secret_for_seeding
SEED_BASE_URL=http://localhost:3000
ADMIN_SEED_ENABLED=false
```

### Seeding Operations
```bash
# Seed core system templates (requires dev server running)
npm run seed:core
```

---

## Troubleshooting

### Port Issues
```bash
# Kill processes on common development ports
npm run kill-ports

# Or manually kill specific ports
npx kill-port 3000 3001 54321 5432 8000
```

### Database Connection Issues
```bash
# Check database connectivity
npm run test:api

# Restart local Supabase if using local development
npx supabase stop
npx supabase start
```

### Build Issues
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npx tsc --noEmit --skipLibCheck
```

### Git Issues
```bash
# Reset to last commit (careful!)
git reset --hard HEAD

# Undo last commit but keep changes
git reset --soft HEAD~1

# Check what changed
git diff HEAD~1
```

---

## Deployment Checklist

Before deploying major changes:

- [ ] Run `npm run build` locally to ensure no build errors
- [ ] Run `npx tsc --noEmit --skipLibCheck` to check TypeScript
- [ ] Test critical user flows in browser
- [ ] Check that all environment variables are set
- [ ] Verify database migrations work correctly
- [ ] Review git diff to understand all changes
- [ ] Write descriptive commit message
- [ ] Create appropriate deployment tag
- [ ] Monitor Vercel deployment after pushing

---

## Tag Naming Conventions

Use descriptive tags for better deployment tracking:

```bash
# Feature releases
v20250912-143000-invite-links
v20250912-143000-member-management
v20250912-143000-auth-flow

# Bug fixes
v20250912-143000-hotfix
v20250912-143000-bugfix-relationships

# UI updates
v20250912-143000-ui-update
v20250912-143000-responsive-design

# Database changes
v20250912-143000-db-migration
v20250912-143000-rls-policies
```

---

## Quick Reference

### Most Common Commands
```bash
# Daily development
npm run dev

# Quick deployment
git add . && git commit -m "Update: [description]" && git push origin main

# Deploy with tag
git push origin main && git tag -a v$(date +%Y%m%d-%H%M%S) -m "Deployment" && git push origin --tags

# Database migration
cd supabase && npx supabase db push

# Type check
npx tsc --noEmit --skipLibCheck

# Port cleanup
npm run kill-ports
```

### Emergency Commands
```bash
# Rollback last commit (if not pushed)
git reset --soft HEAD~1

# Force push (use with extreme caution)
git push --force-with-lease origin main

# Quick local build test
npm run build && npm run start
```

---

This document should be updated as new deployment procedures are established or when the development workflow changes.