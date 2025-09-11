const { Pool } = await import('pg').then(m => m.default || m)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://worldweaver_user:worldweaver2025!@localhost:5432/worldweaver_dev'
})

async function testConnection() {
  try {
    const client = await pool.connect()
    
    console.log('🔍 Testing WorldWeaver Local Database Connection...\n')
    
    // Test basic connection
    const result = await client.query('SELECT NOW()')
    console.log('✅ Database connected successfully!')
    console.log('📅 Current time:', result.rows[0].now)
    console.log('')
    
    // Test tables exist
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    console.log('📋 Tables found:', tables.rows.length)
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`))
    console.log('')
    
    // Test system templates
    const templates = await client.query('SELECT name, category FROM templates WHERE is_system = true ORDER BY name')
    console.log('🎨 System templates:', templates.rows.length)
    templates.rows.forEach(row => console.log(`  - ${row.name} (${row.category})`))
    console.log('')
    
    // Test test user exists
    const users = await client.query('SELECT email, email_confirmed FROM auth_users')
    console.log('👥 Users in database:', users.rows.length)
    users.rows.forEach(row => console.log(`  - ${row.email} (confirmed: ${row.email_confirmed})`))
    console.log('')
    
    // Test profile was created via trigger
    const profiles = await client.query('SELECT email, full_name FROM profiles')
    console.log('👤 Profiles created:', profiles.rows.length)
    profiles.rows.forEach(row => console.log(`  - ${row.email} (${row.full_name || 'No name'})`))
    console.log('')
    
    client.release()
    await pool.end()
    
    console.log('🎉 Local database test completed successfully!')
    console.log('')
    console.log('🚀 Next Steps:')
    console.log('1. Install PostgreSQL packages: npm install pg @types/pg')
    console.log('2. Create .env.local with DATABASE_URL')
    console.log('3. Start developing with your local database!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
    console.error('')
    console.error('💡 Make sure:')
    console.error('- PostgreSQL is running')
    console.error('- worldweaver_dev database exists')
    console.error('- worldweaver_user has correct password')
    process.exit(1)
  }
}

testConnection()
