# MCP Server Setup Instructions for WorldWeaver

## ✅ **Already Completed**

1. **MCP Servers Installed:**
   - ✅ @modelcontextprotocol/server-memory
   - ✅ @modelcontextprotocol/server-filesystem  
   - ✅ @modelcontextprotocol/server-sequential-thinking
   - ✅ enhanced-postgres-mcp-server
   - ✅ puppeteer-mcp-server

2. **Configuration File Created:**
   - ✅ `.claude/config.json` with server definitions

## 🔧 **Manual Configuration Required**

### 1. **Database Connection (PostgreSQL Server)**

Update your Supabase connection string in `.claude/config.json`:

```bash
# Find your Supabase connection string in your Supabase dashboard
# Go to Settings > Database > Connection string
# Use the "URI" format (not session mode)
```

Replace `your_supabase_database_url_here` with your actual connection string:
```
postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-ID].supabase.co:5432/postgres
```

### 2. **Restart Claude Code**

After updating the configuration:
1. Save the config.json file
2. Restart Claude Code completely
3. The MCP servers should now be available

## 🚀 **Testing Your Setup**

Once configured, you can test each MCP server:

### **Memory Server**
```
Remember that WorldWeaver is a Next.js world-building application with Supabase backend
```

### **Filesystem Server** 
```
List all TypeScript files in the components directory
```

### **Sequential Thinking Server**
```
Help me plan the next phase of WorldWeaver development
```

### **PostgreSQL Server** (after configuring DATABASE_URL)
```
Show me the structure of the worlds table
```

### **Puppeteer Server**
```
Take a screenshot of the WorldWeaver homepage
```

## 🎯 **WorldWeaver-Specific Use Cases**

### **Database Operations**
- Query entity relationships
- Analyze world data patterns  
- Debug RLS policies
- Performance monitoring

### **File Operations**
- Batch update imports across components
- Search for specific patterns in codebase
- Generate file structure documentation
- Refactor file organization

### **Problem Solving**
- Plan complex feature implementations
- Debug multi-step issues
- Architectural decisions
- Code review workflows

### **UI Testing**
- Automated screenshot comparisons
- Performance testing
- Accessibility audits
- Cross-browser testing

## 📝 **Next Steps After Setup**

1. **Configure DATABASE_URL** for PostgreSQL access
2. **Test each server** with simple commands
3. **Integrate into workflow** - start using them for daily tasks
4. **Consider additional servers** based on needs

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **MCP server not found:**
   ```bash
   npm list -g | grep modelcontextprotocol
   ```

2. **Permission errors:**
   - Check `.claude/settings.local.json` permissions
   - Ensure Claude Code has file system access

3. **Database connection fails:**
   - Verify Supabase connection string format
   - Check network connectivity
   - Confirm database credentials

4. **Servers not appearing:**
   - Restart Claude Code completely
   - Check config.json syntax with JSON validator
   - Look for error messages in Claude Code logs

Your MCP servers are now ready to supercharge your WorldWeaver development workflow! 🚀