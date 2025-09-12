#!/usr/bin/env node

// WorldWeaver API endpoint tests (auth-aware, RESTful)

const path = require('path')
const dotenv = require('dotenv')
const { createClient } = require('@supabase/supabase-js')

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'

async function getAuthCookies() {
  const email = process.env.TEST_EMAIL
  const password = process.env.TEST_PASSWORD
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!email || !password || !url || !anon) {
    console.log('Skipping auth: set TEST_EMAIL, TEST_PASSWORD, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY to exercise authenticated endpoints.')
    return ''
  }

  const supabase = createClient(url, anon)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data?.session) {
    console.log('Auth failed:', error?.message || 'No session returned')
    return ''
  }
  const at = data.session.access_token
  const rt = data.session.refresh_token
  // Cookies understood by @supabase/ssr in Next middleware
  const cookie = `sb-access-token=${at}; sb-refresh-token=${rt}`
  return cookie
}

async function request(endpoint, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers })
  const text = await res.text()
  let json
  try { json = JSON.parse(text) } catch { json = { raw: text } }
  console.log(`${options.method || 'GET'} ${endpoint} -> ${res.status}`)
  console.log(JSON.stringify(json, null, 2))
  console.log('')
  return { res, json }
}

async function run() {
  console.log('Testing WorldWeaver REST API endpoints\n')

  const cookie = await getAuthCookies()
  const authHeaders = cookie ? { Cookie: cookie } : {}

  // 1) List worlds (requires auth)
  await request('/api/worlds', { headers: authHeaders })

  // 2) Create a world
  const create = await request('/api/worlds', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'API Test World', description: 'Created by test script', isPublic: false })
  })
  const worldId = create?.json?.world?.id
  if (!worldId) {
    console.log('Create world failed or unauthenticated; aborting follow-up tests.')
    return
  }

  // 3) Get world by id
  await request(`/api/worlds/${worldId}`, { headers: authHeaders })

  // 4) Update world
  await request(`/api/worlds/${worldId}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ name: 'API Test World (updated)', description: 'Updated via test' })
  })

  // 5) Create invite (owner/admin only)
  await request(`/api/worlds/${worldId}/invites`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ email: process.env.TEST_INVITE_EMAIL || 'nobody@example.com', role: 'viewer', expiresInDays: 3 })
  })

  // 6) Delete world
  await request(`/api/worlds/${worldId}`, { method: 'DELETE', headers: authHeaders })

  // 7) Verify deletion
  await request(`/api/worlds/${worldId}`, { headers: authHeaders })
}

if (require.main === module) {
  run().catch(err => {
    console.error('Test run failed:', err)
    process.exit(1)
  })
}

module.exports = { run }

