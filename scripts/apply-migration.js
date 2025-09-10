#!/usr/bin/env node

// Apply a SQL migration file against the configured DATABASE_URL.
// Usage: node scripts/apply-migration.js path/to/file.sql

const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

// Load env from project .env.local/.env if present
try {
  const dotenv = require('dotenv')
  dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
  dotenv.config({ path: path.resolve(__dirname, '../.env') })
} catch {}

async function main() {
  const fileArg = process.argv[2]
  if (!fileArg) {
    console.error('Usage: node scripts/apply-migration.js path/to/file.sql')
    process.exit(1)
  }

  const filePath = path.resolve(process.cwd(), fileArg)
  if (!fs.existsSync(filePath)) {
    console.error('SQL file not found:', filePath)
    process.exit(1)
  }

  const sql = fs.readFileSync(filePath, 'utf8')
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('Missing DATABASE_URL in environment')
    process.exit(1)
  }

  const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
  const client = await pool.connect()

  try {
    console.log('Applying migration:', filePath)
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
    console.log('Migration applied successfully')
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('Migration failed:', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()

