# Phase 10: DevOps — Docker, Deploy, Backups

## Delivered

- `docker-compose.yml` — postgres, redis, admin, web
- `deploy/Dockerfile.admin`, `deploy/Dockerfile.web`, `nginx-web.conf`
- `deploy/DEPLOY.md` runbook
- `deploy/scripts/backup-db.sh`, `restore-db.sh`, `migrate.sh`

## Local infra only

```bash
docker compose up -d postgres redis
```
