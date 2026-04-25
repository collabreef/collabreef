# CollabReef

[繁體中文](./README.zh-TW.md)

**CollabReef** is an open-source, self-hosted collaborative service to organize notes and resources in a flexible and visual way.

## Features

### Collaborative Views
- **Notes** — rich-text notes with real-time co-editing powered by Y.js
- **Whiteboard** — multi-layer canvas with freehand drawing, shapes, text, sticky notes, and connector edges
- **Spreadsheet** — collaborative spreadsheet with formulas, cell styling, merging, and frozen rows/columns
- **Kanban Board** — drag-and-drop task management with customizable columns
- **Calendar** — event scheduling with date ranges, timed events, and all-day support
- **Map** — geographic markers with location pinning

### Rich Text Editor
- **Slash Commands** — quickly insert content blocks with `/` menu
- **Embeds** — YouTube, Twitter/X, Instagram, Facebook, TikTok, Threads
- **Media** — images, videos, attachments, carousels
- **Blocks** — sub-pages, inline view previews, location, calendar event, rating, tags

### Sharing & Access Control
- **Public Sharing** — share notes and views via public links
- **Explore Page** — browse publicly shared notes
- **Visibility Levels** — per-resource access control: private, workspace, or public

### Workspace & User Management
- **Multiple Workspaces** — organize content by project or topic
- **Member Roles** — owner, admin, and member role assignments
- **Member Invitations** — invite members by email
- **Admin Panel** — manage users, reset passwords, disable or delete accounts

### Developer & Power User
- **File Management** — upload, rename, download, and delete files with S3/MinIO support
- **API Keys** — create and manage API keys with expiry support
- **Fully Self-Hosted** — full data ownership, SQLite or PostgreSQL
- **Docker Ready** — deploy in minutes with Docker Compose

---

## Installation

### Docker Compose (Recommended)

```yaml
services:
  api:
    image: ti777777/collabreef
    container_name: collabreef-api
    command: ["./api"]
    volumes:
      - collabreef_data:/usr/local/app/bin
    environment:
      PORT: 8080
      DB_DRIVER: sqlite3
      DB_DSN: /usr/local/app/bin/collabreef.db
      # APP_SECRET: your-secret-key
      # APP_DISABLE_SIGNUP: true
    restart: unless-stopped

  collab:
    image: ti777777/collabreef
    container_name: collabreef-collab
    command: ["node", "collab/src/index.js"]
    environment:
      PORT: 3000
      GRPC_ADDR: collabreef-api:50051
      # APP_SECRET: your-secret-key
    depends_on:
      - api
    restart: unless-stopped

  nginx:
    image: ti777777/collabreef-nginx
    container_name: collabreef-nginx
    ports:
      - "80:80"
    depends_on:
      - api
      - collab
    restart: unless-stopped

volumes:
  collabreef_data:
    driver: local
```

```bash
docker compose up -d
```

The app will be available at `http://localhost`.

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `APP_SECRET` | Secret key for signing tokens | — |
| `APP_DISABLE_SIGNUP` | Disable public registration | `false` |
| `DB_DRIVER` | Database driver (`sqlite3` or `postgres`) | `sqlite3` |
| `DB_DSN` | Database connection string | — |

## Contributing

Contributions are welcome! Fork the repo, create a feature branch, and open a pull request.

## License

CollabReef is licensed under the **MIT License**.
