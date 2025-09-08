#!/usr/bin/env node

// Small helper to trigger the admin seed route from Node
// Requires the dev server running on SEED_BASE_URL (default http://localhost:3000)
// Loads env from .env.local/.env so you can avoid passing the token manually.

// Try to load dotenv from project root or monorepo root
try {
  const path = require('path')
  const dotenv = require('dotenv')
  // Load project-level .env.local first (does not override existing)
  dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
  // Fallback: .env
  dotenv.config({ path: path.resolve(__dirname, '../.env') })
} catch (_) {
  // dotenv is optional; if missing, we continue with process.env
}

const BASE_URL = process.env.SEED_BASE_URL || 'http://localhost:3000'
const TOKEN = process.env.SEED_ADMIN_TOKEN

async function main() {
  if (!TOKEN) {
    console.error('SEED_ADMIN_TOKEN is not set in env')
    process.exit(1)
  }

  const url = `${BASE_URL}/api/admin/seed-core-templates`
  console.log(`Seeding core templates via: ${url}`)

  try {
    const res = await fetch(url + `?token=${encodeURIComponent(TOKEN)}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    })

    const body = await res.json().catch(() => ({}))

    if (!res.ok) {
      console.error('Seed failed:', body)
      process.exit(1)
    }

    console.log('Seed complete:', JSON.stringify(body.summary || body, null, 2))
    if (Array.isArray(body.results)) {
      for (const item of body.results) {
        console.log(` - ${item.action.toUpperCase()}: ${item.name}`)
      }
    }
  } catch (err) {
    console.error('Request error:', err)
    process.exit(1)
  }
}

main()
