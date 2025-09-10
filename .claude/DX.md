You are my senior DX engineer. Audit and FIX my Supabase ↔ Next.js app so the database integration is complete and every table is properly “hooked up” to the code.

## Context
- OS: Windows 11 (dev)
- Framework: Next.js (App Router, TypeScript)
- Backend: Supabase (DB/Auth/Storage)
- Hosting: Vercel (prod)
- Repo root: current workspace

## Objectives (do all of this; create/modify files as needed)
1) ENV & clients sanity
   - Verify the following envs exist (locally and in Vercel settings):
       NEXT_PUBLIC_SUPABASE_URL
       NEXT_PUBLIC_SUPABASE_ANON_KEY
       SUPABASE_SERVICE_ROLE_KEY   # server-only, never shipped to the browser
   - Ensure `.gitignore` excludes `.env*`.
   - Ensure client split:
       • `lib/supabase/browser.ts` → `@supabase/ssr` createBrowserClient with NEXT_PUBLIC_* envs
       • `lib/supabase/server.ts`  → `@supabase/ssr` createServerClient using cookies
       • `lib/supabase/admin.ts`   → `@supabase/supabase-js` createClient with SERVICE_ROLE (server-only module, `import 'server-only'`)
   - If any are missing/incorrect, add/fix.

2) Introspect the actual database schema
   - Using the admin client, query Postgres catalog to pull a full picture of the public schema:
       • Tables & views: `information_schema.tables`
       • Columns: `information_schema.columns`
       • PKs/FKs/unique: `information_schema.table_constraints` + `key_column_usage`
       • Indexes: `pg_indexes`
       • RLS enabled tables & policies: `pg_catalog.pg_policies`, `pg_class.relrowsecurity`
       • RPC functions (if used): `pg_proc` (filter by `prokind='f'` and schema)
   - Serialize this to `scripts/_introspection.json` (pretty printed).

3) Cross-check code ↔ DB (the “hooked up” check)
   - Parse the TypeScript source to find all DB usages:
       • Supabase table references: `.from('<table>')`, `.rpc('<fn>')`
       • Storage buckets: `.storage.from('<bucket>')`
       • Optional ORM schemas (Drizzle/Prisma): if present, load the schema and compare to DB.
   - Build a list of **referenced tables/functions/buckets** from the code.
   - Compare against `_introspection.json`:
       • For each referenced table: verify it exists.
       • For each referenced column used in code (simple static checks like `select('a,b,c')`, filters, inserts): verify the columns exist with compatible nullability/types.
       • For each referenced RPC: verify it exists with matching arg names/types.
       • For each referenced bucket: verify it exists (create if a known, expected bucket is missing—ask via TODO comment if unsure).
   - Emit a machine-readable report to `scripts/_integration_report.json` and a human summary in the terminal.

4) Migrations & drift
   - If the repo has `supabase/migrations`, run a **local** check:
       • If `supabase/config.toml` exists, document commands in `DEV.md` (Windows-friendly PowerShell):
           - `supabase start`
           - where to find Studio/keys
       • Run `supabase db reset` locally to apply all migrations into the local stack. Capture success/fail.
   - If the project is linked, run `supabase db diff --linked` to detect drift. If not linked, add a TODO to link or use `--project-ref`.
   - If drift is found, generate a new migration or update code/types so app == DB.

5) Types generation & compile safety
   - Generate TypeScript types for the DB and wire them in:
       • `npm i -D supabase` (CLI) if missing (or ensure it’s available)
       • `npx supabase gen types typescript --project-id "<project-ref or url+service role (local)>" > src/types/supabase.ts`
   - Replace unsafe `any` with column-accurate types in data access layers.
   - Ensure the project compiles with `tsc --noEmit` and fails if types don’t match schema.

6) Automated runtime checks (read/write/RLS)
   - Create `scripts/checkDbIntegration.ts` (Node, run with `npx tsx`):
       • Validate required envs.
       • For each referenced table:
           - With **admin** client: `select 1` from the table to assert existence.
           - If table is user-scoped (heuristics: has `user_id` UUID or policies): 
               · Sign in a test user (create one via admin API if needed), then use **anon** client with that session to:
                 · Attempt SELECT on rows owned by the user (expect OK)
                 · Attempt SELECT on someone else’s rows (expect 0 rows)
                 · Attempt INSERT of a throwaway row (expect OK if app requires it), then delete it
       • For each referenced RPC: invoke with safe dummy args (if possible) and expect a valid return or specific error.
       • For each referenced Storage bucket: upload a small temp file and delete it.
       • Print a PASS/FAIL table and exit non-zero on any failure.
   - Add npm script: `"health:db": "tsx scripts/checkDbIntegration.ts"`

7) Minimal health endpoints
   - Add `app/api/health/db/route.ts` to call a lightweight version of the checks (no writes by default) and return JSON:
       `{ schema: "ok|fail", rlsSample: "ok|warn|skip", storage: "ok|fail", rpc: "ok|skip", details: {...} }`
   - Add `/health` page to display the JSON in a simple PASS/FAIL UI.

8) Output artifacts
   - `DEV.md` with exact Windows-friendly commands:
       • Start local Supabase, copy keys, run Next.js, run checks
       • How to generate types and re-run
   - Final terminal report including:
       • Missing tables/columns/functions/buckets (if any) + code locations
       • RLS coverage summary (which tables are protected, which are open)
       • Migrations status/drift and what you changed
       • Exact commands for me to run locally and what URL(s) to open

## Acceptance criteria (don’t stop until all are green)
- `npm run health:db` → overall PASS
- `tsc --noEmit` → no type errors related to Supabase types
- `/api/health/db` → 200 with `"schema":"ok"`
- All code-referenced tables/columns/RPCs/buckets exist and match usage
- No accidental exposure of `SUPABASE_SERVICE_ROLE_KEY` to the client

## Starter snippets (adapt as needed)

--- lib/supabase/admin.ts ---
import 'server-only';
import { createClient } from '@supabase/supabase-js';
export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

--- scripts/checkDbIntegration.ts ---
import { createClient } from '@supabase/supabase-js';

function need(name:string){const v=process.env[name]; if(!v) throw new Error(`Missing ENV ${name}`); return v;}
async function tableExists(admin:any, table:string){
  const { data, error } = await admin.rpc('pg_table_is_visible', { relname: table }).catch(()=>({error: new Error('rpc missing')} as any));
  if (!error && data === true) return true;
  const q = await admin.from(table).select('count', { count: 'exact', head: true });
  return !q.error;
}

(async () => {
  try {
    const url = need('NEXT_PUBLIC_SUPABASE_URL');
    const service = need('SUPABASE_SERVICE_ROLE_KEY');
    const admin = createClient(url, service, { auth: { persistSession:false } });

    // Load referenced entities (Claude: populate this from code scan)
    const referenced = {
      tables: [/* filled by Claude via code scan */],
      storageBuckets: [/* filled by Claude via code scan */],
      rpcs: [/* filled by Claude via code scan */],
    };

    const results:any = { tables:{}, buckets:{}, rpcs:{} };

    for (const t of referenced.tables){
      results.tables[t] = await tableExists(admin, t) ? 'ok' : 'missing';
    }
    for (const b of referenced.storageBuckets){
      try {
        const { data: buckets } = await admin.storage.listBuckets();
        results.buckets[b] = buckets?.some(x => x.name===b) ? 'ok' : 'missing';
      } catch { results.buckets[b] = 'error'; }
    }
    for (const fn of referenced.rpcs){
      try {
        const { error } = await admin.rpc(fn, {} as any);
        results.rpcs[fn] = (!error || /missing|does not exist/i.test(error.message)===false) ? 'ok' : 'missing';
      } catch { results.rpcs[fn] = 'error'; }
    }

    console.table(results.tables);
    console.table(results.buckets);
    console.table(results.rpcs);

    const failed = [
      ...Object.values(results.tables),
      ...Object.values(results.buckets),
      ...Object.values(results.rpcs)
    ].some(v => v!=='ok');

    if (failed){ throw new Error('DB integration checks failed'); }
    console.log('DB INTEGRATION: PASS');
    process.exit(0);
  } catch (e:any) {
    console.error('DB INTEGRATION: FAIL\n', e?.message ?? e);
    process.exit(1);
  }
})();
