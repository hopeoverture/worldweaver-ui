# MCP (Model Context Protocol) Setup Guide

## 🚀 Overview

This project includes 6 MCP servers to enhance development workflow and database interactions:

1. **Memory** - Persistent context and note-taking
2. **Filesystem** - File operations and code analysis
3. **Sequential Thinking** - Complex problem solving
4. **Supabase (Official)** - Official Supabase operations
5. **Supabase Advanced** - Comprehensive Supabase tools
6. **PostgreSQL** - Raw database access and analysis
7. **Puppeteer** - Browser automation and testing

## 📋 Configuration

### Environment Variables Required

To use the Supabase MCP servers, set these environment variables:

```bash
# Required for both Supabase MCP servers
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Required for advanced Supabase operations
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Required for direct PostgreSQL access
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
```

### Configuration File Location

The MCP configuration is stored in `.claude/config.json`. Update the placeholder values with your actual Supabase credentials.

## 🔧 MCP Server Details

### 1. **Memory Server**
- **Package**: `@modelcontextprotocol/server-memory`
- **Purpose**: Remember project context, track issues, store development notes
- **Usage**: Ask Claude to remember important decisions, bug reports, or implementation details

### 2. **Filesystem Server**
- **Package**: `@modelcontextprotocol/server-filesystem`
- **Purpose**: File system operations, code reading/writing, directory traversal
- **Usage**: Read configuration files, analyze code structure, write documentation

### 3. **Sequential Thinking Server**
- **Package**: `@modelcontextprotocol/server-sequential-thinking`
- **Purpose**: Complex debugging, multi-step problem solving, planning
- **Usage**: Debug complex issues, plan architecture changes, analyze performance problems

### 4. **Official Supabase Server**
- **Package**: `@supabase/mcp-server-supabase`
- **Environment**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- **Purpose**: Standard Supabase operations using official SDK
- **Capabilities**:
  - Database queries via PostgREST
  - Authentication operations
  - Storage file management
  - Edge Functions interaction

### 5. **Advanced Supabase Server**
- **Package**: `mcp-supabase`
- **Environment**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Purpose**: Advanced database operations with service role permissions
- **Capabilities**:
  - Complex database operations
  - Bulk data management
  - Storage bucket operations
  - Advanced query optimization

### 6. **PostgreSQL Server**
- **Package**: `enhanced-postgres-mcp-server`
- **Environment**: `DATABASE_URL`
- **Purpose**: Raw SQL access for deep database analysis
- **Capabilities**:
  - Raw SQL queries
  - Schema analysis and optimization
  - Performance monitoring
  - Index analysis

### 7. **Puppeteer Server**
- **Package**: `puppeteer-mcp-server`
- **Purpose**: Browser automation for testing and debugging
- **Capabilities**:
  - UI testing and screenshots
  - Performance monitoring
  - Accessibility testing
  - Frontend debugging

## 💡 Usage Examples

### Database Operations
```
Ask Claude: "Use the Supabase MCP to show me all worlds in the database"
Ask Claude: "Query the PostgreSQL MCP to analyze the performance of the worlds table"
```

### File Operations
```
Ask Claude: "Use filesystem MCP to analyze the structure of the src/components directory"
Ask Claude: "Read all TypeScript files in src/lib/services and identify common patterns"
```

### Development Workflow
```
Ask Claude: "Remember this bug: Entity creation fails with validation error on template field"
Ask Claude: "Use sequential thinking to debug the authentication flow step by step"
```

### UI Testing
```
Ask Claude: "Use Puppeteer to test the world creation flow and take screenshots"
Ask Claude: "Check accessibility of the dashboard page with browser automation"
```

## 🔐 Security Considerations

1. **Service Role Key**: Only use in development. Never expose in client-side code.
2. **Environment Variables**: Store in `.env.local` (gitignored) for security.
3. **Database URL**: Contains credentials - keep secure and rotate regularly.
4. **Anon Key**: Safe for client-side use but should be from development project.

## 🛠️ Installation & Setup

1. **Install Dependencies** (already done):
   ```bash
   npm install @supabase/mcp-server-supabase mcp-supabase
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Update MCP Config**:
   - Edit `.claude/config.json`
   - Replace placeholder values with actual credentials
   - Save and restart Claude Code

4. **Test MCP Servers**:
   ```
   Ask Claude: "List available MCP servers and test the Supabase connection"
   ```

## 🐛 Troubleshooting

### MCP Server Not Starting
- Check environment variables are set correctly
- Verify Supabase project URL and keys are valid
- Ensure packages are installed: `npm list | grep mcp`

### Connection Issues
- Test Supabase connectivity: `npx supabase status`
- Verify network access to Supabase project
- Check database URL format and credentials

### Permission Errors
- Service role key may be invalid or expired
- Check RLS policies allow the operations you're attempting
- Verify user has necessary permissions

## 📚 Additional Resources

- [Supabase MCP Server Documentation](https://www.npmjs.com/package/@supabase/mcp-server-supabase)
- [Model Context Protocol Spec](https://modelcontextprotocol.io/)
- [Claude Code MCP Guide](https://docs.anthropic.com/claude/docs/claude-code)

## 🎯 Best Practices

1. **Use appropriate MCP server for the task**:
   - Official Supabase MCP for standard operations
   - Advanced MCP for bulk operations
   - PostgreSQL MCP for raw SQL and analysis

2. **Combine MCP servers effectively**:
   - Use Memory to track debugging sessions
   - Use Sequential Thinking for complex problems
   - Use Filesystem for code analysis

3. **Environment management**:
   - Use development Supabase project for MCP
   - Keep production credentials separate
   - Rotate keys regularly

---

*This MCP setup enhances development workflow with powerful database and filesystem integration, making Claude Code more capable for WorldWeaver development tasks.*