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

CollabReef is available on Docker Hub as a single image that can run both the web service and background worker.

For production use with background job processing and real-time collaboration features:

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

  web:
    image: collabreef/collabreef
    container_name: collabreef-web
    command: ["./web"]
    ports:
      - "8080:8080"
    volumes:
      - collabreef_data:/usr/local/app/bin
    environment:
      REDIS_ADDR: redis:6379
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped

  worker:
    image: collabreef/collabreef
    container_name: collabreef-worker
    command: ["./worker"]
    volumes:
      - collabreef_data:/usr/local/app/bin
    environment:
      REDIS_ADDR: redis:6379
    depends_on:
      redis:
        condition: service_healthy
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
