import { useEffect, useRef, useState, useCallback } from 'react'
import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'

interface UseNoteCollabOptions {
  noteId: string
  workspaceId: string
  enabled: boolean
}

interface UserInfo {
  id: string
  name: string
}

export function useNoteCollab(options: UseNoteCollabOptions) {
  const { noteId, workspaceId, enabled } = options

  const providerRef = useRef<HocuspocusProvider | null>(null)
  const yDocRef = useRef<Y.Doc | null>(null)
  const yTextRef = useRef<Y.Text | null>(null)
  const yMetaRef = useRef<Y.Map<any> | null>(null)

  const [isConnected, setIsConnected] = useState(false)
  const [isSynced, setIsSynced] = useState(false)
  const [title, setTitle] = useState('')
  const [activeUsers, setActiveUsers] = useState<UserInfo[]>([])

  useEffect(() => {
    if (!enabled || !noteId || !workspaceId) return

    // Create Y.js document
    const yDoc = new Y.Doc()
    const yText = yDoc.getText('content')
    const yMeta = yDoc.getMap('meta')

    yDocRef.current = yDoc
    yTextRef.current = yText
    yMetaRef.current = yMeta

    // Build WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/ws/notes/${noteId}`

    // Create HocuspocusProvider
    const provider = new HocuspocusProvider({
      url,
      name: `note:${noteId}`,
      document: yDoc,
      onConnect() {
        setIsConnected(true)
      },
      onDisconnect() {
        setIsConnected(false)
        setIsSynced(false)
      },
      onSynced() {
        setIsSynced(true)
      },
      onAwarenessUpdate({ states }) {
        const users: UserInfo[] = []
        states.forEach((state: any) => {
          if (state.user) {
            users.push(state.user)
          }
        })
        setActiveUsers(users)
      },
    })

    providerRef.current = provider

    // Observe title changes from Y.Map
    const metaObserver = () => {
      const newTitle = yMeta.get('title')
      if (newTitle !== undefined) {
        setTitle(newTitle as string)
      }
    }
    yMeta.observe(metaObserver)

    // Set initial title if already in doc
    const existingTitle = yMeta.get('title')
    if (existingTitle !== undefined) {
      setTitle(existingTitle as string)
    }

    return () => {
      yMeta.unobserve(metaObserver)
      provider.destroy()
      yDoc.destroy()
      providerRef.current = null
      yDocRef.current = null
      yTextRef.current = null
      yMetaRef.current = null
      setIsConnected(false)
      setIsSynced(false)
      setTitle('')
      setActiveUsers([])
    }
  }, [noteId, workspaceId, enabled])

  const sendUpdateTitle = useCallback((newTitle: string) => {
    const yMeta = yMetaRef.current
    const yDoc = yDocRef.current
    if (yMeta && yDoc) {
      yDoc.transact(() => {
        yMeta.set('title', newTitle)
      })
    }
    setTitle(newTitle)
  }, [])

  return {
    isConnected,
    isSynced,
    isReady: isSynced,
    title,
    activeUsers,
    sendUpdateTitle,
    yDoc: yDocRef.current,
    yText: yTextRef.current,
    yMeta: yMetaRef.current,
    provider: providerRef.current,
  }
}
