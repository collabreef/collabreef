import { Server } from '@hocuspocus/server'
import { DatabaseExtension } from './extensions/database-extension.js'
import { AuthExtension } from './extensions/auth-extension.js'
import { createGrpcClient } from './grpc/client.js'

const PORT = parseInt(process.env.PORT || '3000', 10)
const GRPC_ADDR = process.env.GRPC_ADDR || 'localhost:50051'

// Initialize gRPC client (replaces direct DB access)
const db = createGrpcClient(GRPC_ADDR)

// Configure Hocuspocus server
const server = new Server({
  port: PORT,
  extensions: [
    new AuthExtension({ db }),
    new DatabaseExtension({ db }),
  ],
  async onListen() {
  },
})

server.listen()

// Graceful shutdown
async function shutdown() {
  await server.destroy()
  db.close()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
