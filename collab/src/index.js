import { Server } from '@hocuspocus/server'
import { DatabaseExtension } from './extensions/database-extension.js'
import { AuthExtension } from './extensions/auth-extension.js'
import { createDB } from './db/db.js'

const PORT = parseInt(process.env.PORT || '3000', 10)

// Initialize Database
const db = createDB()
console.log(`Database initialized (driver: ${process.env.DB_DRIVER || 'sqlite3'})`)

// Configure Hocuspocus server
const server = Server.configure({
  port: PORT,
  extensions: [
    new AuthExtension(),
    new DatabaseExtension({ db }),
  ],
  async onListen(data) {
    console.log(`Hocuspocus collab service listening on port ${data.port}`)
  },
})

server.listen()

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down collab service...')
  await server.destroy()
  await db.close()
  console.log('Collab service stopped')
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
