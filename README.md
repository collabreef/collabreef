# CollabReef

**CollabReef** is an open-source, self-hosted collaborative service to organize links, notes, and resources in a flexible and visual way.

## Features

### Workspace Dashboard
- **15 Built-in Widgets** — note, countdown, carousel, heatmap, RSS reader, music player, video player, iframe, folder, link, map, calendar, and more
- **Customizable Layout** — drag-and-drop widget positioning

### Collaborative Views
- **Notes** — rich-text notes with real-time co-editing powered by Y.js
- **Whiteboard** — multi-layer canvas with freehand drawing, shapes, text, sticky notes, and connector edges
- **Spreadsheet** — collaborative spreadsheet with formulas, cell styling, merging, and frozen rows/columns
- **Kanban Board** — drag-and-drop task management with customizable columns
- **Calendar** — event scheduling with date ranges, timed events, and all-day support
- **Map** — geographic markers with location pinning

### Sharing & Access Control
- **Public Sharing** — share notes, whiteboards, spreadsheets, kanban, calendar, and map views via public links
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
      # APP_SECRET: your-secret-key
    restart: unless-stopped

  api:
    image: ti777777/collabreef
    container_name: collabreef-api
    command: ["./api"]
    volumes:
      - collabreef_data:/usr/local/app/bin
    environment:
      PORT: 8080
      # APP_SECRET: your-secret-key
      # APP_DISABLE_SIGNUP: true
    depends_on:
      - collab
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


## Contributing

Contributions are welcome! Fork the repo, create a feature branch, and open a pull request.

## License

CollabReef is licensed under the **MIT License**.
