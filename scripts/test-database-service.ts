import { localDb, Template } from '../src/lib/database/local'

// Set environment variable for testing if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://worldweaver_user:worldweaver2025!@localhost:5432/worldweaver_dev'
}

async function testDatabaseService() {
  try {
    console.log('🔍 Testing WorldWeaver Database Service...\n')
    
    // Test connection
    const connection = await localDb.testConnection()
    console.log('✅ Database connection successful!')
    console.log('📅 Current time:', connection.current_time)
    console.log('')
    
    // Get database stats
    const stats = await localDb.getStats()
    console.log('📊 Database Statistics:')
    console.log(`  - Tables: ${stats.tables}`)
    console.log(`  - System Templates: ${stats.systemTemplates}`)
    console.log(`  - Users: ${stats.users}`)
    console.log(`  - Worlds: ${stats.worlds}`)
    console.log('')
    
    // Test system templates
    const templates = await localDb.getSystemTemplates()
    console.log('🎨 System Templates Available:')
    templates.forEach((template: Template) => {
      console.log(`  - ${template.name} (${template.category}) - ${template.fields.length} fields`)
    })
    console.log('')
    
    // Test user operations
    const testUser = await localDb.getUserByEmail('developer@worldweaver.com')
    console.log('👤 Test User Found:')
    console.log(`  - Email: ${testUser.email}`)
    console.log(`  - ID: ${testUser.id}`)
    console.log(`  - Confirmed: ${testUser.email_confirmed}`)
    console.log('')
    
    // Test profile
    const profile = await localDb.getProfile(testUser.id)
    console.log('👤 Profile Information:')
    console.log(`  - Email: ${profile.email}`)
    console.log(`  - Full Name: ${profile.full_name || 'Not set'}`)
    console.log(`  - Username: ${profile.username || 'Not set'}`)
    console.log('')
    
    // Test worlds for user
    const worlds = await localDb.getWorldsByUser(testUser.id)
    console.log('🌍 Worlds for User:', worlds.length)
    console.log('')
    
    console.log('🎉 Database service test completed successfully!')
    console.log('')
    console.log('🚀 Your local database is ready for WorldWeaver development!')
    console.log('')
    console.log('📝 Available Operations:')
    console.log('  - User management (create, get, update)')
    console.log('  - Profile management')
    console.log('  - World operations (create, list, get)')
    console.log('  - Template operations (system & custom)')
    console.log('  - Entity management (create, list, get)')
    console.log('  - Database utilities and stats')
    
  } catch (error) {
    console.error('❌ Database service test failed:', error)
    process.exit(1)
  }
}

testDatabaseService()
