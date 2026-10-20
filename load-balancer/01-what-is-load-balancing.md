# 01 — What is load balancing?

## Simple idea

Imagine a busy shop with **two cashiers** and **one receptionist**.

- Customers arrive at the receptionist (the load balancer).
- The receptionist sends customer 1 to cashier A, customer 2 to cashier B, customer 3 to A again, and so on.
- No single cashier gets overloaded if both are healthy.

That receptionist is a **load balancer**.

## In computer terms

- You have **more than one server** running the same app.
- A load balancer receives every request first.
- It **distributes** requests across those servers.

Common policies:

| Policy | Meaning |
|---|---|
| Round-robin | Take turns: 1 → A, 2 → B, 3 → A, 4 → B… |
| Least connections | Send to whoever is least busy |
| IP hash | Same client IP always hits the same server |

In this project we use **round-robin** (Nginx default).

## Why assignments ask for this

Real systems scale by adding machines. A load balancer is how traffic is shared without changing the client URL. Clients only know one address (the balancer), not every backend machine.

## What we use here

| Role | Tool |
|---|---|
| Load balancer | Nginx |
| Server 1 (like VM 1) | Docker container `backend1` |
| Server 2 (like VM 2) | Docker container `backend2` |
| Shared database | Docker container `postgres` |

Next: [02-why-docker-not-cloud.md](02-why-docker-not-cloud.md)
