import { useEffect, useState } from 'react'
import type { WebsocketProvider } from 'y-websocket'
import type * as Y from 'yjs'

export interface SyncStatus {
  isConnected: boolean
  isSynced: boolean
  connectionStatus: string
  onlineUsers: number
  lastSyncTime: Date | null
}

/**
 * Hook for tracking Y.js synchronization status
 */
export function useYjsSyncStatus(
  provider: WebsocketProvider | null,
  doc: Y.Doc | null
): SyncStatus {
  const [isConnected, setIsConnected] = useState(false)
  const [isSynced, setIsSynced] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [onlineUsers, setOnlineUsers] = useState(0)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  useEffect(() => {
    if (!provider || !doc) {
      return
    }

    // Connection status handler
    const handleStatus = (event: { status: string }) => {
      setConnectionStatus(event.status)
      setIsConnected(event.status === 'connected')

      if (event.status === 'connected') {
        console.log('WebSocket connected')
      } else if (event.status === 'disconnected') {
        console.log('WebSocket disconnected')
      }
    }

    // Sync status handler
    const handleSync = (synced: boolean) => {
      setIsSynced(synced)

      if (synced) {
        setLastSyncTime(new Date())
        console.log('Document synced')
      }
    }

    // Awareness handler for online users
    const handleAwarenessChange = () => {
      if (provider.awareness) {
        const states = provider.awareness.getStates()
        setOnlineUsers(states.size)
      }
    }

    // Register event listeners
    provider.on('status', handleStatus)
    provider.on('sync', handleSync)

    if (provider.awareness) {
      provider.awareness.on('change', handleAwarenessChange)
      // Initialize online users count
      handleAwarenessChange()
    }

    // Cleanup
    return () => {
      provider.off('status', handleStatus)
      provider.off('sync', handleSync)

      if (provider.awareness) {
        provider.awareness.off('change', handleAwarenessChange)
      }
    }
  }, [provider, doc])

  return {
    isConnected,
    isSynced,
    connectionStatus,
    onlineUsers,
    lastSyncTime,
  }
}

/**
 * Get a human-readable sync status message
 */
export function getSyncStatusMessage(status: SyncStatus): string {
  if (!status.isConnected) {
    return 'Offline - Changes will sync when reconnected'
  }

  if (!status.isSynced) {
    return 'Syncing...'
  }

  if (status.lastSyncTime) {
    const now = new Date()
    const diff = now.getTime() - status.lastSyncTime.getTime()

    if (diff < 5000) {
      return 'Synced just now'
    } else if (diff < 60000) {
      return `Synced ${Math.floor(diff / 1000)}s ago`
    } else {
      return `Synced ${Math.floor(diff / 60000)}m ago`
    }
  }

  return 'Synced'
}

/**
 * Get sync status color (for UI indicators)
 */
export function getSyncStatusColor(status: SyncStatus): 'green' | 'yellow' | 'red' | 'gray' {
  if (!status.isConnected) {
    return 'red'
  }

  if (!status.isSynced) {
    return 'yellow'
  }

  return 'green'
}
