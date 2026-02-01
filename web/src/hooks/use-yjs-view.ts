import { useEffect, useState, useRef, useCallback } from 'react'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { AuthenticatedWebSocketProvider } from '@/lib/yjs/websocket-provider'

export interface UseYjsViewConfig {
  viewId: string
  workspaceId: string
  enabled?: boolean
}

export interface UseYjsViewReturn {
  doc: Y.Doc | null
  provider: AuthenticatedWebSocketProvider | null
  isConnected: boolean
  isSynced: boolean
  connectionStatus: string
  yMap: Y.Map<any> | null
  yArray: Y.Array<any> | null
  getMap: (name: string) => Y.Map<any> | null
}

/**
 * Hook for managing Y.js document and WebSocket connection for a view
 */
export function useYjsView(config: UseYjsViewConfig): UseYjsViewReturn {
  const { viewId, workspaceId, enabled = true } = config

  const [doc, setDoc] = useState<Y.Doc | null>(null)
  const [provider, setProvider] = useState<AuthenticatedWebSocketProvider | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isSynced, setIsSynced] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  const indexeddbProvider = useRef<IndexeddbPersistence | null>(null)
  const yMapRef = useRef<Y.Map<any> | null>(null)
  const yArrayRef = useRef<Y.Array<any> | null>(null)

  useEffect(() => {
    if (!enabled || !viewId || !workspaceId) {
      return
    }

    // Create Y.js document
    const ydoc = new Y.Doc()
    setDoc(ydoc)

    // Create shared data structures
    const map = ydoc.getMap('view-data')
    const array = ydoc.getArray('view-objects')
    yMapRef.current = map
    yArrayRef.current = array

    // Setup IndexedDB persistence for offline support
    const idbProvider = new IndexeddbPersistence(`collabreef-view-${viewId}`, ydoc)
    indexeddbProvider.current = idbProvider

    idbProvider.on('synced', () => {
      console.log('IndexedDB sync complete')
    })

    // Setup WebSocket provider
    const wsProvider = new AuthenticatedWebSocketProvider(viewId, workspaceId, ydoc, {
      onSync: (synced: boolean) => {
        setIsSynced(synced)
        console.log('WebSocket sync status:', synced)
      },
      onStatus: (status: { status: string }) => {
        setConnectionStatus(status.status)
        setIsConnected(status.status === 'connected')
        console.log('WebSocket status:', status.status)
      },
    })

    setProvider(wsProvider)

    // Cleanup
    return () => {
      console.log('Cleaning up Y.js resources for view', viewId)

      // Disconnect WebSocket
      wsProvider.destroy()

      // Close IndexedDB
      if (indexeddbProvider.current) {
        indexeddbProvider.current.destroy()
      }

      // Destroy document
      ydoc.destroy()

      setDoc(null)
      setProvider(null)
      setIsConnected(false)
      setIsSynced(false)
      setConnectionStatus('disconnected')
    }
  }, [viewId, workspaceId, enabled])

  const getMap = useCallback((name: string) => {
    if (!doc) return null
    return doc.getMap(name)
  }, [doc])

  return {
    doc,
    provider,
    isConnected,
    isSynced,
    connectionStatus,
    yMap: yMapRef.current,
    yArray: yArrayRef.current,
    getMap,
  }
}

/**
 * Hook for observing changes to a Y.js Map
 */
export function useYjsMap<T = any>(yMap: Y.Map<T> | null, onChange?: (event: Y.YMapEvent<T>) => void) {
  const [data, setData] = useState<Map<string, T>>(new Map())

  useEffect(() => {
    if (!yMap) return

    // Initialize data from existing map
    const initialData = new Map<string, T>()
    yMap.forEach((value, key) => {
      initialData.set(key, value)
    })
    setData(initialData)

    // Listen for changes
    const observer = (event: Y.YMapEvent<T>) => {
      // Update local state
      const newData = new Map<string, T>()
      yMap.forEach((value, key) => {
        newData.set(key, value)
      })
      setData(newData)

      // Call custom onChange if provided
      if (onChange) {
        onChange(event)
      }
    }

    yMap.observe(observer)

    return () => {
      yMap.unobserve(observer)
    }
  }, [yMap, onChange])

  return data
}

/**
 * Hook for observing changes to a Y.js Array
 */
export function useYjsArray<T = any>(yArray: Y.Array<T> | null, onChange?: (event: Y.YArrayEvent<T>) => void) {
  const [data, setData] = useState<T[]>([])

  useEffect(() => {
    if (!yArray) return

    // Initialize data from existing array
    setData(yArray.toArray())

    // Listen for changes
    const observer = (event: Y.YArrayEvent<T>) => {
      setData(yArray.toArray())

      // Call custom onChange if provided
      if (onChange) {
        onChange(event)
      }
    }

    yArray.observe(observer)

    return () => {
      yArray.unobserve(observer)
    }
  }, [yArray, onChange])

  return data
}
