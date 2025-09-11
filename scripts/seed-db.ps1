# Seed Postgres database inside running docker container (Windows PowerShell)
# Usage: .\scripts\seed-db.ps1

Write-Host "This script expects docker-compose.yml in the project root and Docker running."
Write-Host "Bringing up the db service (detached)..."

docker-compose up -d db

Write-Host "Waiting 5 seconds for Postgres to initialize..."
Start-Sleep -Seconds 5

# The SQL files are mounted into /docker-entrypoint-initdb.d and will be executed on first run.
Write-Host "If this is the first run, the schema and template SQL files will already be applied by Postgres init scripts."
Write-Host "To re-seed manually, exec psql inside the container (example):"
Write-Host "docker exec -it <container_id> psql -U worldweaver_user -d worldweaver_dev -f /local_database_schema.sql"

Write-Host "Done."
