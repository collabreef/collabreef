# CollabReef

**CollabReef** is an open-source, self-hosted pinboard service to organize links, notes, and resources in a flexible and visual way.

![screenshot](https://github.com/collabreef/collabreef/blob/main/web/src/assets/app.png)

## Features

- **10+ Built-in Widgets** — link, note, carousel, RSS reader, map, calendar, folder, and more
- **Unlimited Workspaces** — organize content by projects, topics, or personal needs
- **Kanban Board** — drag-and-drop task management with multiple columns
- **Collaborative Whiteboard** — real-time brainstorming and visual planning
- **Real-time Collaborative Notes** — CRDT-based sync powered by Y.js
- **Calendar & Map Views** — time-based and location-based content organization
- **Fully Self-Hosted** — deploy on your own server, full data ownership
- **Docker Ready** — simple deployment with Docker Compose

---

## Installation

### Docker Compose (Recommended)

```yaml
services:
  collab:
    image: ti777777/collabreef
    container_name: collabreef-collab
    command: ["node", "collab/src/index.js"]
    volumes:
      - collabreef_data:/usr/local/app/bin
    environment:
      PORT: 3000
      DB_DRIVER: sqlite3
      DB_DSN: /usr/local/app/bin/collabreef.db
    restart: unless-stopped

  web:
    image: ti777777/collabreef
    container_name: collabreef-web
    command: ["./web"]
    ports:
      - "8080:8080"
    volumes:
      - collabreef_data:/usr/local/app/bin
    environment:
      PORT: 8080
      COLLAB_URL: http://collab:3000
      # APP_SECRET: your-secret-key
      # APP_DISABLE_SIGNUP: true
    depends_on:
      - collab
    restart: unless-stopped

volumes:
  collabreef_data:
    driver: local
```

```bash
docker compose up -d
```

The app will be available at `http://localhost:8080`.

### Optional: PostgreSQL

By default CollabReef uses SQLite. To use PostgreSQL, add a `postgres` service and set these environment variables on both `collab` and `web` services:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: collabreef-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: collabreef
      POSTGRES_USER: collabreef
      POSTGRES_PASSWORD: collabreef_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U collabreef"]
      interval: 10s
      timeout: 5s
      retries: 5
```

```yaml
environment:
  DB_DRIVER: postgres
  DB_DSN: "host=postgres port=5432 user=collabreef password=collabreef_password dbname=collabreef sslmode=disable TimeZone=UTC"
```

Also add `DB_MIGRATIONS_PATH: "file://migrations/postgres"` to the `web` service.

### Optional: S3 / MinIO Storage

By default files are stored locally. To use S3-compatible storage, set these on the `web` service:

```yaml
environment:
  STORAGE_TYPE: s3
  STORAGE_S3_ENDPOINT: your-s3-endpoint
  STORAGE_S3_ACCESS_KEY: your-access-key
  STORAGE_S3_SECRET_KEY: your-secret-key
  STORAGE_S3_BUCKET: collabreef
  STORAGE_S3_USE_SSL: "true"
```

---

## Contributing

Contributions are welcome! Fork the repo, create a feature branch, and open a pull request.

## License

CollabReef is licensed under the **MIT License**.
