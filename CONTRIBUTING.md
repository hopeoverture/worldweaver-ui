# Contributing

- Prefer Conventional Commits (feat, fix, chore, docs, refactor, perf, test).
- When using PowerShell, pass commit messages via a quoted string or a variable:
  - $msg = 'chore: update'; git commit -m $msg
  - git commit -m "feat: add X" -m "Body details..."
- Create feature branches off `main` and open PRs instead of pushing to `main`.
- After rebases, use `git push --force-with-lease`.
- Avoid committing logs or swap files; `.gitignore` covers `*.log`.

## Running
- npm run dev for local development
- npm run build && npm start for production
- npm run lint, npm test for checks
