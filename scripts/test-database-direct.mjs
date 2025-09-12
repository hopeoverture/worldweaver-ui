// Simple database service test without environment dependencies
import { Pool } from 'pg'

const pool = new Pool({
  user: 'worldweaver_user',
  host: 'localhost',
  database: 'worldweaver_dev',
  password: 'worldweaver2025!',
  port: 5432,
})

async function testDatabaseServiceDirect() {
  try {
    console.log('dY"? Testing WorldWeaver Database Service (Direct Connection)...\n')
    
    const client = await pool.connect()
    
    // Test basic connection
    const result = await client.query('SELECT NOW() as current_time')
    console.log('�o. Database connection successful!')
    console.log('dY". Current time:', result.rows[0].current_time)
    console.log('')
    
    // Test tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('dY"< Tables found:', tables.rows.length)
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`))
    console.log('')
    
    // Test system templates
    const templates = await client.query('SELECT name, category, fields FROM templates WHERE is_system = true ORDER BY name')
    console.log('dYZ" System Templates:', templates.rows.length)
    templates.rows.forEach(row => {
      const fields = Array.isArray(row.fields) ? row.fields : []
      console.log(`  - ${row.name} (${row.category}) - ${fields.length} fields`)
    })
    console.log('')
    
    // Test users
    const users = await client.query('SELECT email, email_confirmed FROM auth_users')
    console.log('dY`� Users in database:', users.rows.length)
    users.rows.forEach(row => console.log(`  - ${row.email} (confirmed: ${row.email_confirmed})`))
    console.log('')
    
    // Test profiles
    const profiles = await client.query('SELECT email, full_name FROM profiles')
    console.log('dY`\u000f Profiles created:', profiles.rows.length)
    profiles.rows.forEach(row => console.log(`  - ${row.email} (${row.full_name || 'No name'})`))
    console.log('')
    
    client.release()
    await pool.end()
    
    console.log('dYZ% Database service test completed successfully!')
    console.log('')
    console.log('dYs? Database is ready for WorldWeaver development!')
    console.log('')
    console.log('dY"? Available Operations:')
    console.log('  - User management (create, get, update)')
    console.log('  - Profile management')
    console.log('  - World operations (create, list, get)')
    console.log('  - Template operations (system & custom)')
    console.log('  - Entity management (create, list, get)')
    console.log('  - Database utilities and stats')
    
  } catch (error) {
    console.error('�?O Database service test failed:', error)
    process.exit(1)
  }
}

testDatabaseServiceDirect()

