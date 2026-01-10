import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { Awareness } from 'y-protocols/awareness'

export interface YjsProviderConfig {
  doc: Y.Doc
  viewId: string
  workspaceId: string
  onSync?: (synced: boolean) => void
  onStatus?: (status: { status: string }) => void
}

/**
 * Creates a WebSocket provider for Y.js document synchronization
 */
export function createYjsProvider(config: YjsProviderConfig): WebsocketProvider {
  const { doc, viewId, workspaceId, onSync, onStatus } = config

  // Get the WebSocket URL (without viewId - y-websocket will append the room name)
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsHost = window.location.host
  const wsUrl = `${wsProtocol}//${wsHost}/ws/views`

  // Create WebSocket provider (viewId is used as room name and will be appended to URL)
  const provider = new WebsocketProvider(wsUrl, viewId, doc, {
    // Add authentication token to connection params
    params: {
      workspace_id: workspaceId,
    },
    // WebSocket options
    WebSocketPolyfill: undefined,
    // Awareness configuration
    awareness: new Awareness(doc),
    // Reconnect options
    maxBackoffTime: 5000,
    resyncInterval: 5000,
  })

  // Handle sync status
  if (onSync) {
    provider.on('sync', (synced: boolean) => {
      onSync(synced)
    })
  }

  // Handle connection status
  if (onStatus) {
    provider.on('status', (event: { status: string }) => {
      onStatus(event)
    })
  }

  return provider
}

/**
 * Custom WebSocket provider with authentication
 */
export class AuthenticatedWebSocketProvider extends WebsocketProvider {
  constructor(
    viewId: string,
    workspaceId: string,
    doc: Y.Doc,
    opts?: { onSync?: (synced: boolean) => void; onStatus?: (status: { status: string }) => void }
  ) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = window.location.host
    const wsUrl = `${wsProtocol}//${wsHost}/ws/views`

    // viewId is used as room name and will be appended to URL by y-websocket
    super(wsUrl, viewId, doc, {
      params: {
        workspace_id: workspaceId,
      },
      maxBackoffTime: 5000,
      resyncInterval: 5000,
    })

    // Setup event handlers
    if (opts?.onSync) {
      this.on('sync', opts.onSync)
    }

    if (opts?.onStatus) {
      this.on('status', opts.onStatus)
    }
  }
}
