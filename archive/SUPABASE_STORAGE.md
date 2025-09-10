Supabase Storage Setup (world-assets)
====================================

This guide sets up a private storage bucket with RLS policies that mirror `public.world_files` access rules.

Bucket
------
- Name/id: `world-assets`
- Visibility: Private

You can create it via:
- Dashboard: Storage → Create bucket → name `world-assets` → Private
- Or run the migration in this repo (requires service role via Supabase CLI or Dashboard SQL):
  - `supabase/migrations/20250907170000_add_storage_policies.sql`

Policies (storage.objects)
--------------------------
Policies mirror RLS on `public.world_files` and are included in the migration:
- Read: allowed if the user can access the world for the metadata row matching `file_path = storage.objects.name`.
- Insert: allowed if a metadata row exists for that `file_path` and the user can edit the world (owner/admin/editor). `uploaded_by` should match `auth.uid()` when provided.
- Delete: allowed to the original uploader, world owner, or admins.

Notes
-----
- Ensure `public.world_files.file_path` equals `storage.objects.name` (path within the bucket).
- Recommended path convention: `world/<world_id>/<entity_or_folder>/<filename>`.
- Typical flow:
  1) Insert row into `public.world_files` with target path (and metadata) using authenticated session.
  2) Upload file to `world-assets` at the same path using the same session (or a signed URL generated server-side).
  3) On delete, remove both the storage object and metadata row.

Testing
-------
- Verify `SELECT` on `public.world_files` returns rows for your test user/world.
- Attempt object upload to the same `file_path` in `world-assets` as that row.
- Attempt to read/delete via client or signed URL as appropriate.

Minimal Upload API
------------------
Route: `POST /api/worlds/:id/files/upload?kind=uploads`

Form fields:
- `file`: the file to upload (multipart/form-data)

Response:
```json
{
  "ok": true,
  "file": { "id": "...", "worldId": "...", "name": "...", "path": "world/<id>/<kind>/<...>", "size": 123, "mimeType": "..." }
}
```

Example (bash):
```bash
curl -X POST \
  -H "Cookie: sb-access-token=...; sb-refresh-token=..." \
  -F "file=@./my-image.png" \
  "http://localhost:3000/api/worlds/<worldId>/files/upload?kind=entities"
```
