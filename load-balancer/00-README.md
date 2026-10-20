# Load Balancer Demo — Documentation Index

This folder explains the **Docker + Nginx load balancer** setup for LeadFlow in beginner-friendly language.

You do **not** need a cloud account or credit card. Everything runs on your computer with Docker Desktop.

## What you built (one sentence)

Two copies of the backend API run in Docker. Nginx sits in front and sends each request to one of them (round-robin), just like a cloud load balancer in front of two VMs.

## Read in this order

| # | File | What you learn |
|---|---|---|
| 1 | [01-what-is-load-balancing.md](01-what-is-load-balancing.md) | What a load balancer is |
| 2 | [02-why-docker-not-cloud.md](02-why-docker-not-cloud.md) | Why Docker is enough for this assignment |
| 3 | [03-architecture.md](03-architecture.md) | How the pieces connect (diagram) |
| 4 | [04-dockerfile-explained.md](04-dockerfile-explained.md) | Every line of the backend Dockerfile |
| 5 | [05-nginx-explained.md](05-nginx-explained.md) | Every important line of nginx.conf |
| 6 | [06-docker-compose-explained.md](06-docker-compose-explained.md) | What each service in compose does |
| 7 | [07-step-by-step-run.md](07-step-by-step-run.md) | Exact commands to start and use it |
| 8 | [08-how-to-prove-it-works.md](08-how-to-prove-it-works.md) | How to show balancing for screenshots/report |
| 9 | [09-troubleshooting.md](09-troubleshooting.md) | Common problems and fixes |
| 10 | [10-assignment-answers.md](10-assignment-answers.md) | Short answers you can adapt for your report |

## Important files in the project

| Path | Role |
|---|---|
| `docker-compose.yml` | Starts Postgres + backend1 + backend2 + Nginx |
| `backend/Dockerfile` | Recipe to build the API image |
| `nginx/nginx.conf` | Load balancer rules |
| `backend/src/app.js` (`/health`) | Returns `instance` name (backend1 or backend2) |

## Quick start (after reading step 7)

```powershell
cd d:\Projects\Assingments\task2
docker compose up --build -d
docker compose exec backend1 npm run db:migrate
docker compose exec backend1 npm run db:seed
curl.exe -s http://localhost:8080/health
```

Load balancer URL: **http://localhost:8080**
