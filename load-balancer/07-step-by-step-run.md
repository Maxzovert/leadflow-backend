# 07 — Step-by-step: run the load balancer demo

Use **PowerShell** on Windows. Make sure **Docker Desktop is running** (whale icon in the system tray).

## Step 1 — Open the project folder

```powershell
cd d:\Projects\Assingments\task2
```

## Step 2 — Build and start everything

```powershell
docker compose up --build -d
```

What this does:

- `--build` rebuilds the backend image if Dockerfile/code changed
- `-d` runs containers in the background (detached)

Wait ~30–60 seconds the first time (image downloads).

Check status:

```powershell
docker compose ps
```

You should see `postgres`, `backend1`, `backend2`, and `nginx` as running/healthy.

## Step 3 — Create database tables (once)

Run migrate **on one** backend only (both share the same DB):

```powershell
docker compose exec backend1 npm run db:migrate
```

## Step 4 — Seed demo users (once)

```powershell
docker compose exec backend1 npm run db:seed
```

Demo logins:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@demo.com` | `Admin@123` |
| Member | `member@demo.com` | `Member@123` |

## Step 5 — Test the load balancer

```powershell
curl.exe -s http://localhost:8080/health
```

You should see JSON with `"instance":"backend1"` or `"backend2"`.

Hit it several times (see [08-how-to-prove-it-works.md](08-how-to-prove-it-works.md)).

## Step 6 — (Optional) Point the React frontend at the LB

In `frontend/.env`:

```env
VITE_API_URL=http://localhost:8080/api
```

Then:

```powershell
cd frontend
npm run dev
```

Open `http://localhost:5173` and use the app normally. API calls go Client → Nginx → backend1/backend2.

## Useful everyday commands

```powershell
# View logs (all services)
docker compose logs -f

# Logs for one service
docker compose logs -f nginx
docker compose logs -f backend1

# Stop everything (keeps DB volume)
docker compose down

# Stop and delete DB data too (fresh start)
docker compose down -v
```

## If something fails

Go to [09-troubleshooting.md](09-troubleshooting.md).

Next: [08-how-to-prove-it-works.md](08-how-to-prove-it-works.md)
