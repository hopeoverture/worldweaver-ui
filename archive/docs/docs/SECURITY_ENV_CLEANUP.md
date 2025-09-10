Secrets & History Cleanup Guide
================================

This repo currently contains real environment files with sensitive values (e.g., Supabase keys). Follow this guide to safely rotate and purge secrets from git history.

1) Immediate Secret Rotation (Required)
- Supabase Dashboard → Project Settings → API
  - Rotate anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
  - Rotate service_role (SUPABASE_SERVICE_ROLE_KEY)
- Database password rotation (if exposed):
  - Reset DB user password used in `SUPABASE_DB_OWNER_URL`
- Invalidate any other exposed credentials (e.g., tokens in logs).

2) Stop Tracking Local Env Files
- Ensure .gitignore ignores real env files while allowing examples:
  - .env
  - .env.*
  - !.env.example
  - !.env.local.example
- Untrack env files locally (keeps files on disk, removes from index):
  - git rm --cached .env .env.local || true
  - git commit -m "chore(security): stop tracking env files"

3) Rewrite Git History To Remove Secrets
Option A: git filter-repo (recommended)
- pipx install git-filter-repo  # or use your package manager
- Backup your repo (clone a fresh copy to be safe).
- Remove the files from all history:
  - git filter-repo --path .env --path .env.local --invert-paths
- Force push to remote (coordinate with your team):
  - git push --force

Option B: BFG Repo-Cleaner
- Download BFG (https://rtyley.github.io/bfg-repo-cleaner/)
- Create a files-to-delete list (e.g., `bfg-delete-files.txt`):
  - .env
  - .env.local
- Run:
  - java -jar bfg.jar --delete-files bfg-delete-files.txt
  - git reflog expire --expire=now --all && git gc --prune=now --aggressive
  - git push --force

4) Update Deploy/CI With New Secrets
- Store new secrets in GitHub → Settings → Secrets and variables → Actions.
- Do not re-commit secrets; keep only `.env*.example` files in the repo.

5) Validate
- Clone repo fresh and verify no secret values appear in:
  - git log / git grep for keys or URLs
  - GitHub code search
  - CI logs

6) Prevent Recurrence
- Keep `.env` and `.env.local` out of source control.
- Use `.env.example` to document required variables.
- Enable GitHub secret scanning and branch protection.

