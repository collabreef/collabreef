# 📝Notepia

**Notepia** is an open-source, self-hosted pinboard service designed to help you organize links, notes, and resources in a flexible and visual way.

Build your own workspace with widgets, keep everything in one place, and stay in full control of your data.

![screenshot](https://github.com/notepia/notepia/blob/main/web/src/assets/screenshot.png)

## ✨ Features

* 🧩 **10+ Built-in Widgets**
  Choose from more than 10 different widgets, including bookmarks, notes, text blocks, images, to-do lists, and more.

* 🗂️ **Unlimited Workspaces**
  Create unlimited workspaces to organize content by projects, topics, or personal needs.

* 📌 **Flexible Pinboard Layout**
  Arrange and customize widgets freely within each workspace.

* 🗓️ **Calendar View**
Visualize pins and content in a calendar-based view for better time-based organization.

* 🗺️ **Map View**
View location-based pins on an interactive map, perfect for travel plans or geo-related notes.

* ➕ **More Views Coming**
The view system is designed to be extensible, with more views planned in future releases.

* 🌐 **Modern Web Interface**
  Clean, responsive UI optimized for both desktop and mobile devices.

* 🏠 **Fully Self-Hosted**
  Deploy Notepia on your own server and keep full ownership of your data.

* 🧾 **Open Source**
  Transparent, extensible, and community-driven.

* 🐳 **Docker Ready**
  Simple deployment with Docker and Docker Compose.

---

## 🚀 Installation

### Docker (Recommended)

Notepia is available on Docker Hub.

```bash
docker run -d \
  --name notepia \
  -p 8080:8080 \
  -e APP_DISABLE_SIGNUP=true \
  -e APP_SECRET=change-me-to-a-secure-random-string \
  notepia/notepia
```

Then open your browser and visit:

```
http://localhost:8080
```

---

### Docker Compose

```yaml
services:
  notepia:
    image: notepia/notepia
    container_name: notepia
    ports:
      - "8080:8080"
    environment:
      APP_DISABLE_SIGNUP: "true"
      APP_SECRET: change-me-to-a-secure-random-string
    restart: unless-stopped
```

Start the service:

```bash
docker compose up -d
```

---

### Notes

* Make sure to set a **strong `APP_SECRET`** in production.
* Persistent storage can be added later via volumes if needed.

---

## 🤝 Contributing

Contributions are welcome!

* Fork the repository
* Create your feature branch
* Commit your changes
* Open a pull request

---

## 📄 License

Notepia is licensed under the **MIT License**.

---
