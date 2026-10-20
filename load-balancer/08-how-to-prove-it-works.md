# 08 — How to prove load balancing works (for your report)

You need evidence that requests are **not** always hitting the same server.

## Proof 1 — `/health` shows different `instance` values

PowerShell loop:

```powershell
1..10 | ForEach-Object {
  curl.exe -s http://localhost:8080/health
  Write-Host ""
}
```

Look at the `"instance"` field in each JSON body.

Expected pattern (round-robin):

```text
backend1
backend2
backend1
backend2
...
```

(Exact order can start with either instance; what matters is **both** appear.)

**Screenshot tip:** capture the terminal showing alternating names.

## Proof 2 — Response header `X-Upstream`

```powershell
curl.exe -sI http://localhost:8080/health
```

Look for a header like:

```text
X-Upstream: 172.x.x.x:5000
```

The IP may change between requests when Nginx picks the other container.

Verbose form:

```powershell
curl.exe -s -D - -o - http://localhost:8080/health
```

## Proof 3 — `docker compose ps` / Docker Desktop

Screenshot showing four containers:

- `leadflow-pg`
- `leadflow-backend1`
- `leadflow-backend2`
- `leadflow-lb`

## Proof 4 — Stop one backend and show failover behavior

```powershell
docker compose stop backend2
curl.exe -s http://localhost:8080/health
```

All successful responses should show `backend1` only.

Start it again:

```powershell
docker compose start backend2
```

After a moment, both instances should appear again in the loop.

> Note: default Nginx does not remove a down server instantly from the pool the same way cloud LBs do with active health checks. You may briefly see connection errors when a backend is stopped, then recover. For a beginner assignment, alternating instances while **both** are up is the main proof.

## What to write in your report (short)

1. Architecture: Nginx LB → two Node API containers → shared Postgres.
2. Algorithm: round-robin (Nginx default upstream).
3. Evidence: `/health` `instance` field alternates; `X-Upstream` header; container list screenshot.
4. Mapping: containers stand in for VMs on a private network without a paid cloud account.

Next: [09-troubleshooting.md](09-troubleshooting.md)
