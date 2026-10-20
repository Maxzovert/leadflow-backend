# 03 — Architecture (how the pieces fit)

## Picture

```text
                    http://localhost:8080
                              |
                              v
                     +----------------+
                     |  nginx (LB)    |
                     |  leadflow-lb   |
                     +--------+-------+
                              |
              +---------------+---------------+
              |                               |
              v                               v
     +----------------+              +----------------+
     |   backend1     |              |   backend2     |
     | INSTANCE_NAME= |              | INSTANCE_NAME= |
     |   backend1     |              |   backend2     |
     +--------+-------+              +--------+-------+
              |                               |
              +---------------+---------------+
                              |
                              v
                     +----------------+
                     |   postgres     |
                     |  leadflow-pg   |
                     +----------------+
```

## Request path (step by step)

1. You call `http://localhost:8080/health` (or `/api/...`).
2. Docker maps host port **8080** to Nginx port **80** inside the `nginx` container.
3. Nginx looks at its `upstream` list: `backend1:5000` and `backend2:5000`.
4. Nginx forwards the request to the **next** backend in turn (round-robin).
5. That backend talks to Postgres using hostname `postgres` on the Docker network.
6. The response goes back: backend → Nginx → your browser/curl.

## Why both backends share one database

LeadFlow stores users/leads in Postgres. If each backend had its own empty database, login on backend1 would not exist on backend2.

Sharing one DB is normal for this kind of API:

- App servers are **stateless** (they do not store sessions in memory).
- Auth uses a **JWT cookie** signed with the same `JWT_SECRET` on both backends.
- So any backend can verify the cookie.

## Ports you care about

| Where | Port | Meaning |
|---|---|---|
| Your PC → Nginx | `8080` | Only public entry for the API in this demo |
| Inside Docker → backend | `5000` | Node listens here (not exposed to Windows by default) |
| Your PC → Postgres | `5432` | Optional; useful for DB tools |

Clients should use **8080**, not 5000.

## Mapping to “two VMs”

| Assignment wording | This project |
|---|---|
| VM running app #1 | `backend1` container |
| VM running app #2 | `backend2` container |
| Load balancer | `nginx` container |
| Database server | `postgres` container |

Next: [04-dockerfile-explained.md](04-dockerfile-explained.md)
