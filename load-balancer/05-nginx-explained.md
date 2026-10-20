# 05 — Nginx config explained (beginner)

File: `nginx/nginx.conf`

**Nginx** here is not serving a website of HTML files. It acts as a **reverse proxy / load balancer**:

- You talk to Nginx.
- Nginx talks to the backends for you.

## Upstream block (the pool of servers)

```nginx
upstream leadflow_api {
    server backend1:5000;
    server backend2:5000;
}
```

- `upstream` = named group of backends.
- `backend1` and `backend2` are **Docker Compose service names** (DNS names on the Docker network).
- `:5000` is the port Node listens on **inside** those containers.
- With no extra algorithm keyword, Nginx uses **round-robin**.

## Server block (what Nginx listens for)

```nginx
server {
    listen 80;
```

- Inside the Nginx container, listen on port 80.
- Compose maps `8080:80`, so on Windows you use `http://localhost:8080`.

```nginx
    location / {
        proxy_pass http://leadflow_api;
```

- For every path (`/`, `/health`, `/api/...`), forward to the upstream group.
- Nginx picks `backend1` or `backend2` automatically.

```nginx
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
```

- Pass useful info to the backend (original host, client IP, etc.).
- Good practice for apps behind a proxy.

```nginx
        add_header X-Upstream $upstream_addr always;
```

- Adds a response header showing which backend address Nginx used.
- Great for assignment screenshots (together with JSON `instance` from `/health`).

## Analogy reminder

Nginx = receptionist.  
`upstream` = list of cashiers.  
`proxy_pass` = “send this customer to the next cashier.”

Next: [06-docker-compose-explained.md](06-docker-compose-explained.md)
