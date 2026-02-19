import { Server } from '@hocuspocus/server'
import { DatabaseExtension } from './extensions/database-extension.js'
import { AuthExtension } from './extensions/auth-extension.js'
import { createDB } from './db/db.js'

const PORT = parseInt(process.env.PORT || '3000', 10)

// Initialize Database
const db = createDB()

// Configure Hocuspocus server
const server = Server.configure({
  port: PORT,
  extensions: [
    new AuthExtension(),
    new DatabaseExtension({ db }),
  ],
  async onListen() {
  },
})

server.listen()

// Graceful shutdown
async function shutdown() {
  await server.destroy()
  await db.close()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
