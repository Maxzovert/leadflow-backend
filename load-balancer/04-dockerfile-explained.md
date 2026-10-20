# 04 — Dockerfile explained (beginner)

File: `backend/Dockerfile`

A **Dockerfile** is a recipe. Docker reads it and builds an **image** (a template). From that image you can start one or many **containers**.

We build **one** image, then run it twice as `backend1` and `backend2`.

## Line by line

```dockerfile
FROM node:20-alpine
```

- Start from an official Node.js 20 image.
- `alpine` = small Linux base (faster downloads).

```dockerfile
WORKDIR /app
```

- Inside the container, go to folder `/app`.
- Later `COPY` and `RUN` commands happen here.

```dockerfile
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
```

- Copy only dependency lists first.
- `npm ci` installs exact versions from the lockfile (good for Docker).
- `--omit=dev` skips Jest/nodemon — not needed to run the API.
- Doing this **before** copying source code helps Docker **cache** layers: if you only change JS files, dependencies are not reinstalled every build.

```dockerfile
COPY src ./src
```

- Copy the Express app source into the image.

```dockerfile
ENV NODE_ENV=production
ENV PORT=5000
```

- Default environment variables inside the container.
- Compose can still override them.

```dockerfile
EXPOSE 5000
```

- Documents “this app listens on 5000.”
- Does **not** by itself open the port on your Windows machine (Compose/`ports:` does that).

```dockerfile
CMD ["npm", "start"]
```

- When the container starts, run `npm start` → `node src/server.js`.

## Related: `.dockerignore`

File: `backend/.dockerignore`

Like `.gitignore` for Docker builds. We skip `node_modules`, `.env`, tests, etc. so the image stays small and secrets are not copied in by mistake.

## Mental model

```text
Dockerfile  -->  docker build  -->  Image  -->  docker run (x2)  -->  backend1 + backend2
```

Next: [05-nginx-explained.md](05-nginx-explained.md)
