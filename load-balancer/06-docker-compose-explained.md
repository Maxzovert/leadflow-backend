# 06 — Docker Compose explained (beginner)

File: `docker-compose.yml` (project root)

**Docker Compose** lets you describe several containers in one YAML file and start them together with one command.

## Services in this file

### 1) `postgres`

- Official Postgres 16 image.
- Creates database user/password/db: `leadflow` / `leadflow` / `leadflow`.
- Saves data in a **volume** so tables survive container restarts.
- `healthcheck` waits until Postgres is ready before backends start.
- Port `5432` published so you can inspect the DB from Windows if needed.

### 2) `backend1` and `backend2`

- Both **build** from `backend/Dockerfile` (same image).
- Same environment **except** `INSTANCE_NAME`:
  - `backend1` → `INSTANCE_NAME=backend1`
  - `backend2` → `INSTANCE_NAME=backend2`
- `DATABASE_URL` points to host `postgres` (Compose DNS), not `localhost`.
  - Inside a container, `localhost` means **itself**, not your PC and not the DB container.
- `depends_on` + healthcheck: backends wait until Postgres is ready.
- Backend ports are **not** mapped to Windows. You must go through Nginx. That matches a real LB setup.

YAML note: `&backend_env` and `<<: *backend_env` copy the shared env block so we do not duplicate every variable twice.

### 3) `nginx`

- Official Nginx image.
- Mounts our config file into the container:
  - `./nginx/nginx.conf` → `/etc/nginx/conf.d/default.conf`
- Publishes `8080:80` so the load balancer is reachable at `http://localhost:8080`.
- `depends_on` backends so they start first (best effort; health of Node is separate).

## Shared network (automatic)

Compose creates a private network. Containers can reach each other by **service name**:

- `backend1` can ping `postgres`
- `nginx` can reach `backend1` and `backend2`

Your browser cannot reach `backend1:5000` directly unless you add a `ports:` mapping (we intentionally did not).

## Environment variables that matter

| Variable | Why |
|---|---|
| `DATABASE_URL` | Both APIs share one DB |
| `JWT_SECRET` | Must be identical on both backends |
| `CLIENT_URL` | CORS for the React app on `:5173` |
| `INSTANCE_NAME` | Shown in `/health` so you can prove balancing |
| `COOKIE_SECURE=false` | Local HTTP (not HTTPS) |

Next: [07-step-by-step-run.md](07-step-by-step-run.md)
