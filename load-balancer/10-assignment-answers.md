# 10 — Short answers you can adapt for your assignment

Use these as a starting point. Rewrite in your own words if your teacher requires originality.

---

## Q: How did you implement load balancing without a cloud provider?

I used **Docker Compose** to run two identical backend containers (`backend1`, `backend2`) and an **Nginx** container as a reverse proxy / load balancer. Clients send requests to Nginx on port 8080. Nginx forwards them to the backends using **round-robin**. Both backends share one Postgres container so data stays consistent. This mirrors two VMs behind a load balancer on a private network, without needing a paid cloud account.

---

## Q: What is the request flow?

Client → Nginx (load balancer) → backend1 or backend2 → Postgres → response back through Nginx to the client.

---

## Q: Which load balancing algorithm did you use?

**Round-robin** (Nginx default for an `upstream` block with multiple servers and no special directive).

---

## Q: How do you prove it works?

Calling `GET /health` repeatedly returns JSON with `"instance":"backend1"` or `"instance":"backend2"`. The values alternate when both containers are healthy. Nginx also returns an `X-Upstream` response header showing which upstream address handled the request.

---

## Q: Why can either backend handle a logged-in user?

The API is **stateless**. Authentication uses a JWT stored in an HTTP-only cookie, signed with the **same** `JWT_SECRET` on both instances. Any backend can verify the token. User and lead data live in the **shared** Postgres database.

---

## Q: What maps to virtual machines in your design?

| Concept | Implementation |
|---|---|
| VM 1 | Docker container `backend1` |
| VM 2 | Docker container `backend2` |
| Load balancer | Docker container `nginx` |
| Database server | Docker container `postgres` |
| Private network | Docker Compose network |

---

## Q: What files are important?

- `docker-compose.yml` — defines all services
- `backend/Dockerfile` — builds the API image
- `nginx/nginx.conf` — upstream + proxy_pass load balancer config
- `docs/load-balancer/` — this beginner documentation set

---

## Commands summary

```powershell
docker compose up --build -d
docker compose exec backend1 npm run db:migrate
docker compose exec backend1 npm run db:seed
curl.exe -s http://localhost:8080/health
docker compose down
```
