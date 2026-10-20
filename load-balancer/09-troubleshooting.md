# 09 — Troubleshooting

## Docker Desktop is not running

**Symptom:** `error during connect` or `Cannot connect to the Docker daemon`

**Fix:** Start Docker Desktop and wait until it says running, then retry `docker compose up`.

---

## Port 8080 already in use

**Symptom:** Nginx fails to bind / “address already in use”

**Fix:** Stop the other program using 8080, or change compose ports to `"8081:80"` and use `http://localhost:8081`.

---

## Port 5432 already in use

**Symptom:** Postgres container exits

**Fix:** Another Postgres is running on Windows. Stop it, or change compose to `"5433:5432"` (backends still use `postgres:5432` **inside** Docker — only the host mapping changes).

---

## `database "leadflow" does not exist` / relation does not exist

**Cause:** You forgot migrate.

**Fix:**

```powershell
docker compose exec backend1 npm run db:migrate
docker compose exec backend1 npm run db:seed
```

---

## Backend keeps restarting

**Check logs:**

```powershell
docker compose logs backend1
docker compose logs backend2
```

Common causes:

- Postgres not ready yet (wait / restart compose)
- Bad `DATABASE_URL` (must use host `postgres`, not `localhost`)
- Missing `JWT_SECRET` (compose already sets it)

---

## Always the same `instance` in /health

Possible reasons:

1. Only one backend is running — check `docker compose ps`
2. You are not hitting Nginx (`8080`) — maybe an old Node process on `5000`
3. Browser cache — use `curl.exe` instead

Confirm both:

```powershell
docker compose ps
docker compose logs nginx --tail 20
```

---

## CORS errors from the React app

**Fix:** Ensure compose `CLIENT_URL` includes `http://localhost:5173` (already set) and frontend `.env` has:

```env
VITE_API_URL=http://localhost:8080/api
```

Restart frontend after changing `.env`.

---

## `npm ci` failed while building the image

**Fix:** Make sure `backend/package-lock.json` exists, then:

```powershell
docker compose build --no-cache backend1
```

---

## Want a completely clean reset

```powershell
docker compose down -v
docker compose up --build -d
docker compose exec backend1 npm run db:migrate
docker compose exec backend1 npm run db:seed
```

`-v` deletes the Postgres volume (all DB data).

Next: [10-assignment-answers.md](10-assignment-answers.md)
