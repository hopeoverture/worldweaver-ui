#!/usr/bin/env node

// Seed core templates directly into a local Postgres database.
// This bypasses the Next.js API route and Supabase, and instead
// uses the pg client to talk to your local DB.
//
// It dynamically transpiles and loads src/lib/coreTemplates.ts so
// we can reuse the source of truth for template definitions.

const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

// Register a minimal TypeScript require hook so we can require TS files
function registerTsRequireHook() {
  const ts = require('typescript')
  require.extensions['.ts'] = function (module, filename) {
    const source = fs.readFileSync(filename, 'utf8')
    const transpiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2019,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
        allowJs: true,
        resolveJsonModule: true,
      },
      fileName: filename,
    })
    return module._compile(transpiled.outputText, filename)
  }
}

registerTsRequireHook()

async function main() {
  // Resolve and import createCoreTemplates from TS source
  const coreTemplatesPath = path.resolve(__dirname, '../src/lib/coreTemplates.ts')
  /** @type {{ createCoreTemplates: (worldId: string, folderId?: string) => Array<any> }} */
  const { createCoreTemplates } = require(coreTemplatesPath)

  // Build payload matching the DB schema
  const core = createCoreTemplates('system')
  const payload = core.map((t) => ({
    name: t.name,
    description: t.description || null,
    icon: t.icon || null,
    category: t.category || 'Core',
    fields: t.fields,
    is_system: true,
    world_id: null,
  }))

  // Connect to local Postgres (or use DATABASE_URL if provided)
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://worldweaver_user:worldweaver2025!@localhost:5432/worldweaver_dev'

  const pool = new Pool({ connectionString })
  const client = await pool.connect()

  try {
    console.log('Seeding core templates to local DB...')

    // Fetch existing system templates by name
    const names = payload.map((p) => p.name)
    const { rows: existing } = await client.query(
      `SELECT id, name FROM public.templates
       WHERE is_system = true AND world_id IS NULL AND name = ANY($1)`,
      [names]
    )

    const existingByName = new Map(existing.map((r) => [r.name, r.id]))

    let inserted = 0
    let updated = 0
    const results = []

    // Perform upserts by name for system templates
    for (const p of payload) {
      const id = existingByName.get(p.name)
      if (id) {
        await client.query(
          `UPDATE public.templates
             SET description = $2,
                 icon = $3,
                 category = $4,
                 fields = $5::jsonb,
                 is_system = true,
                 world_id = NULL,
                 updated_at = NOW()
           WHERE id = $1`,
          [id, p.description, p.icon, p.category, JSON.stringify(p.fields)]
        )
        updated += 1
        results.push({ name: p.name, action: 'updated' })
      } else {
        await client.query(
          `INSERT INTO public.templates
             (name, description, icon, category, fields, is_system, world_id)
           VALUES ($1, $2, $3, $4, $5::jsonb, true, NULL)`
          , [p.name, p.description, p.icon, p.category, JSON.stringify(p.fields)]
        )
        inserted += 1
        results.push({ name: p.name, action: 'inserted' })
      }
    }

    console.log('Seed complete:')
    console.log(` - inserted: ${inserted}`)
    console.log(` - updated:  ${updated}`)
    console.log(` - total:    ${payload.length}`)
    for (const r of results) {
      console.log(`   • ${r.action.toUpperCase()}: ${r.name}`)
    }
  } catch (err) {
    console.error('Seeding failed:', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()

