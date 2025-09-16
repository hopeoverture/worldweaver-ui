# Gemini Agent Context: WorldWeaver UI

## Project Overview

This project is the **WorldWeaver UI**, a web application for creating, managing, and exploring creative universes. It is a modern, full-stack application built with a strong emphasis on type safety, performance, and a structured development workflow.

**Key Technologies:**
- **Framework:** Next.js 15.5.2 (with App Router)
- **UI:** React 19.1.0, Tailwind CSS 4.1.13
- **Language:** TypeScript (strict mode)
- **Backend & Database:** Supabase (Auth, PostgreSQL, Storage) with SSR support
- **State Management:** TanStack Query for server state, Zustand for client state
- **Validation:** Zod for runtime validation and type safety
- **Testing:** Vitest
- **Linting:** ESLint

**Architecture:**
- The application uses the Next.js App Router for file-based routing.
- It leverages Server-Side Rendering (SSR) and authenticated API routes, with Supabase handling user authentication and data access.
- The frontend is built with a component-based architecture, with reusable UI components in `src/components/ui` and feature-specific components in `src/components/{feature}`.
- The backend logic is organized into services in `src/lib/services`.
- Database migrations are managed in the `supabase/migrations` directory.

## Building and Running

**1. Installation:**
```bash
npm install
```

**2. Environment Setup:**
Create a `.env.local` file with the necessary Supabase and OpenAI API keys. Refer to `.env.example` for the required variables.

**3. Development:**
```bash
# Start the development server
npm run dev
```

**4. Building for Production:**
```bash
# Create a production build
npm run build

# Start the production server
npm run start
```

**5. Testing and Code Quality:**
```bash
# Run the test suite
npm run test

# Run the linter
npm run lint

# Check for TypeScript errors
npm run typecheck
```

## Development Conventions

### Git and Commits
- **Conventional Commits:** Use prefixes like `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`.
- **Branching:** Create feature branches off `main` and use Pull Requests for merging.

### AI Agent Workflow (SPARC & Claude-Flow)
This project uses a specific methodology for AI-assisted development, as outlined in `CLAUDE.md`. Key principles include:
- **Concurrency:** Perform all related operations (e.g., file reads, writes, agent tasks) in a single, parallelized step.
- **File Organization:** Do not save working files to the root folder. Use designated subdirectories (`src`, `tests`, `docs`, etc.).
- **Agent-Based Development:** The project is designed to be worked on by AI agents using a system called "Claude-Flow" for orchestration. This involves spawning agents for specific tasks (coding, testing, research) and using hooks for coordination.

### Code Style
- The project uses ESLint and Prettier (inferred from the presence of config files) to enforce a consistent code style.
- TypeScript is used with strict mode enabled, so all new code should be strongly typed.

### File Structure
- **`src/app`**: Contains the application's pages and API routes.
- **`src/components`**: Contains React components, organized into `ui` for reusable primitives and feature-specific folders.
- **`src/lib`**: Contains shared libraries, services, and Supabase client code.
- **`src/hooks`**: Contains custom React hooks, organized by query and mutation hooks.
- **`supabase/migrations`**: Contains SQL migration files for the database schema.
- **`scripts`**: Contains various utility and test scripts.
