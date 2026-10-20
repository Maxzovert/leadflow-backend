# 02 — Why Docker instead of a cloud free trial?

## The assignment goal

Show that you can:

1. Run the API on **two** machines/instances
2. Put a **load balancer** in front
3. Prove requests are distributed

Cloud VMs (AWS EC2, Azure VMs, GCP) do this in production — but they usually need a credit card even for “free tier.”

## Docker as a stand-in for VMs

A **container** is a lightweight package that runs your app with its own filesystem and process space.

For learning load balancing:

| Cloud idea | Docker equivalent |
|---|---|
| Virtual Machine 1 | Container `backend1` |
| Virtual Machine 2 | Container `backend2` |
| Load balancer appliance / LB service | Container `nginx` |
| Private network between VMs | Docker Compose network |
| Shared database server | Container `postgres` |

You still learn the **same concepts**: multiple app instances, one entry point, shared data store, health checks.

## Why this is valid for many college labs

- You demonstrate distribution of traffic.
- You show isolation (two separate processes).
- You show a reverse proxy / LB config.
- You can take screenshots of curl output alternating `backend1` / `backend2`.

Always check your assignment rubric. If it **requires** named cloud VMs, Docker may only be a local practice setup. For “demonstrate LB with two backends,” Docker Compose is usually accepted when cloud is unavailable.

## What you need installed

1. **Docker Desktop** for Windows (includes Docker Engine + Compose)
2. This project folder
3. Optional: a browser or `curl.exe` to test

No Azure / AWS / GCP account required.

Next: [03-architecture.md](03-architecture.md)
