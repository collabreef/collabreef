import { useEffect, useRef, useState, useCallback } from 'react'
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'
import { SpreadsheetSheetData, SpreadsheetOp } from '../types/view'

interface UseSpreadsheetCollabOptions {
  viewId: string
  workspaceId: string
  enabled: boolean
  isPublic?: boolean
}

const MAX_OPS_HISTORY = 200

export function useSpreadsheetCollab(options: UseSpreadsheetCollabOptions) {
  const { viewId, workspaceId, enabled, isPublic = false } = options

  const providerRef = useRef<HocuspocusProvider | null>(null)
  const yDocRef = useRef<Y.Doc | null>(null)
  const ySpreadsheetRef = useRef<Y.Map<any> | null>(null)
  const yOpsRef = useRef<Y.Array<any> | null>(null)
  const isSyncCompleteRef = useRef(false)

  const [isConnected, setIsConnected] = useState(false)
  const [isSynced, setIsSynced] = useState(false)
  const [sheets, setSheets] = useState<SpreadsheetSheetData[] | null>(null)
  const [pendingOps, setPendingOps] = useState<SpreadsheetOp[]>([])

  useEffect(() => {
    if (!enabled || !viewId) return
    if (!isPublic && !workspaceId) return

    isSyncCompleteRef.current = false

    // Create Y.js document
    const yDoc = new Y.Doc()
    const ySpreadsheet = yDoc.getMap('spreadsheet')
    const yOps = yDoc.getArray('ops')

    yDocRef.current = yDoc
    ySpreadsheetRef.current = ySpreadsheet
    yOpsRef.current = yOps

    // Build WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const path = isPublic ? `/ws/public/views/${viewId}` : `/ws/views/${viewId}`
    const url = `${protocol}//${window.location.host}${path}`

    // Create HocuspocusProvider
    const provider = new HocuspocusProvider({
      url,
      name: `spreadsheet:${viewId}`,
      document: yDoc,
      onConnect() {
        setIsConnected(true)
      },
      onDisconnect() {
        setIsConnected(false)
        setIsSynced(false)
        isSyncCompleteRef.current = false
      },
      onSynced() {
        setIsSynced(true)
        // Load initial full state from Y.Map
        syncSheetsFromYjs()
        // After this point, real-time cell edits arrive via Y.Array ops
        isSyncCompleteRef.current = true
      },
    })

    providerRef.current = provider

    // Observe Y.Array for remote fortune-sheet ops (real-time cell edits)
    const opsObserver = (event: Y.YArrayEvent<any>) => {
      // Ignore events during initial sync (stale ops from previous session)
      if (!isSyncCompleteRef.current) return
      // Ignore local changes (we already applied them locally)
      if (event.transaction.local) return

      const newOps: SpreadsheetOp[] = []
      for (const delta of event.changes.delta) {
        if (delta.insert && Array.isArray(delta.insert)) {
          for (const entry of delta.insert) {
            if (entry && entry.ops) {
              newOps.push(...entry.ops)
            }
          }
        }
      }

      if (newOps.length > 0) {
        setPendingOps(prev => [...prev, ...newOps])
      }
    }
    yOps.observe(opsObserver)

    function syncSheetsFromYjs() {
      const sheetsData: SpreadsheetSheetData[] = []
      ySpreadsheet.forEach((value, key) => {
        if (!key.startsWith('_')) {
          sheetsData.push(value as SpreadsheetSheetData)
        }
      })
      sheetsData.sort((a, b) => (a.order || 0) - (b.order || 0))
      if (sheetsData.length > 0) {
        setSheets(sheetsData)
      }
    }

    return () => {
      yOps.unobserve(opsObserver)
      provider.destroy()
      yDoc.destroy()
      providerRef.current = null
      yDocRef.current = null
      ySpreadsheetRef.current = null
      yOpsRef.current = null
      isSyncCompleteRef.current = false
      setIsConnected(false)
      setIsSynced(false)
      setSheets(null)
      setPendingOps([])
    }
  }, [viewId, workspaceId, enabled, isPublic])

  // Send fortune-sheet ops to other clients (real-time forwarding via Y.Array)
  const sendOps = useCallback((ops: SpreadsheetOp[]) => {
    if (isPublic) return

    const yOps = yOpsRef.current
    const yDoc = yDocRef.current
    if (!yOps || !yDoc) return

    yDoc.transact(() => {
      yOps.push([{ ops }])

      // Trim old ops to prevent unbounded growth
      if (yOps.length > MAX_OPS_HISTORY) {
        yOps.delete(0, yOps.length - MAX_OPS_HISTORY)
      }
    })
  }, [isPublic])

  // Sync full sheet state to Y.Map for persistence (called from onChange, after state is committed)
  const syncSheets = useCallback((currentSheets: SpreadsheetSheetData[]) => {
    if (isPublic) return

    const ySpreadsheet = ySpreadsheetRef.current
    const yDoc = yDocRef.current
    if (!ySpreadsheet || !yDoc) return

    yDoc.transact(() => {
      const existingKeys = new Set<string>()
      ySpreadsheet.forEach((_, key) => {
        if (!key.startsWith('_')) existingKeys.add(key)
      })

      const currentKeys = new Set(currentSheets.map(s => s.id))

      for (const key of existingKeys) {
        if (!currentKeys.has(key)) {
          ySpreadsheet.delete(key)
        }
      }

      for (const sheet of currentSheets) {
        ySpreadsheet.set(sheet.id, sheet)
      }
    })
  }, [isPublic])

  const clearPendingOps = useCallback(() => {
    setPendingOps([])
  }, [])

  // Read current full state from Y.Map (for re-mount on structural ops)
  const getLatestSheets = useCallback((): SpreadsheetSheetData[] | null => {
    const ySpreadsheet = ySpreadsheetRef.current
    if (!ySpreadsheet) return null

    const sheetsData: SpreadsheetSheetData[] = []
    ySpreadsheet.forEach((value, key) => {
      if (!key.startsWith('_')) {
        sheetsData.push(value)
      }
    })
    sheetsData.sort((a, b) => (a.order || 0) - (b.order || 0))
    return sheetsData.length > 0 ? sheetsData : null
  }, [])

  return {
    sendOps,
    syncSheets,
    isConnected,
    sheets,
    pendingOps,
    clearPendingOps,
    getLatestSheets,
    isInitialized: isSynced,
    yDoc: yDocRef.current,
    provider: providerRef.current,
  }
}
