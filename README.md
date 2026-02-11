# CollabReef

**CollabReef** is an open-source, self-hosted pinboard service designed to help you organize links, notes, and resources in a flexible and visual way.

Build your own workspace with widgets, keep everything in one place, and stay in full control of your data.

![screenshot](https://github.com/collabreef/collabreef/blob/main/web/src/assets/app.png)

## ✨ Features

* 🧩 **10+ Built-in Widgets**
  Choose from more than 10 different widgets, including link, note, carousel, rss reader, map, calendar, folder, and more.

* 🗂️ **Unlimited Workspaces**
  Create unlimited workspaces to organize content by projects, topics, or personal needs.

* 📌 **Flexible Pinboard Layout**
  Arrange and customize widgets freely within each workspace.

* 🗓️ **Calendar View**
  Visualize pins and content in a calendar-based view for better time-based organization.

* 🗺️ **Map View**
  View location-based pins on an interactive map, perfect for travel plans or geo-related notes.

* 📋 **Kanban Board**
  Organize tasks with a powerful kanban board supporting drag-and-drop, multiple columns, and task management.

* 🎨 **Collaborative Whiteboard**
  Real-time collaborative whiteboard for brainstorming, sketching, and visual planning with your team.

* ✍️ **Real-time Collaborative Notes**
  Edit notes together in real-time with CRDT-based synchronization powered by Y.js, ensuring conflict-free collaboration.

* 🌐 **Modern Web Interface**
  Clean, responsive UI optimized for both desktop and mobile devices.

* 🏠 **Fully Self-Hosted**
  Deploy CollabReef on your own server and keep full ownership of your data.

* 🧾 **Open Source**
  Transparent, extensible, and community-driven.

* 🐳 **Docker Ready**
  Simple deployment with Docker and Docker Compose.

---

## 🚀 Installation

### Docker Compose (Recommended)

CollabReef is available on Docker Hub as a single image with different entrypoints for the web server and collaboration service.

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: collabreef-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  collab:
    image: collabreef/collabreef
    container_name: collabreef-collab
    command: ["node", "collab/src/index.js"]
    volumes:
      - collabreef_data:/usr/local/app/bin
    environment:
      PORT: 3000
      REDIS_ADDR: redis:6379
      DB_DRIVER: sqlite3
      DB_DSN: /usr/local/app/bin/collabreef.db
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped

  web:
    image: collabreef/collabreef
    container_name: collabreef-web
    command: ["./web"]
    ports:
      - "8080:8080"
    volumes:
      - collabreef_data:/usr/local/app/bin
    environment:
      PORT: 8080
      REDIS_ADDR: redis:6379
      COLLAB_URL: http://collab:3000
      # APP_SECRET: your-secret-key
      # APP_DISABLE_SIGNUP: true
    depends_on:
      redis:
        condition: service_healthy
      collab:
        condition: service_started
    restart: unless-stopped

volumes:
  redis_data:
    driver: local
  collabreef_data:
    driver: local
```

Start the services:

```bash
docker compose up -d
```

The app will be available at `http://localhost:8080`.

#### Optional: PostgreSQL

By default CollabReef uses SQLite. To use PostgreSQL instead, add a `postgres` service and update the environment variables:

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

Then set these environment variables on both `collab` and `web` services:

```yaml
environment:
  DB_DRIVER: postgres
  DB_DSN: "host=postgres port=5432 user=collabreef password=collabreef_password dbname=collabreef sslmode=disable TimeZone=UTC"
```

Additionally, add `DB_MIGRATIONS_PATH: "file://migrations/postgres"` to the `web` service.

#### Optional: S3 / MinIO Storage

By default files are stored locally. To use S3-compatible storage, set these environment variables on the `web` service:

```yaml
environment:
  STORAGE_TYPE: s3
  STORAGE_S3_ENDPOINT: your-s3-endpoint
  STORAGE_S3_ACCESS_KEY: your-access-key
  STORAGE_S3_SECRET_KEY: your-secret-key
  STORAGE_S3_BUCKET: collabreef
  STORAGE_S3_USE_SSL: "true"
```

## 🤝 Contributing

Contributions are welcome!

* Fork the repository
* Create your feature branch
* Commit your changes
* Open a pull request

---

## 📄 License

CollabReef is licensed under the **MIT License**.

---
