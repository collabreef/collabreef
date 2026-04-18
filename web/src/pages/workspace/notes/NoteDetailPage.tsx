import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { useEffect, useRef, useState } from "react"
import { getNote, NoteData, updateNote } from "@/api/note"
import NoteDetailView from "@/components/notedetail/NoteDetailView"
import { useNoteCollab } from "@/hooks/use-note-collab"
import NoteDetailMenu from "@/components/notedetailmenu/NoteDetailMenu"

const NoteDetailPage = () => {
    const [note, setNote] = useState<NoteData | null>(null)
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { noteId } = useParams()
    const queryClient = useQueryClient()

    // Refs to always capture latest values for use in effect cleanups
    const latestContentRef = useRef<string>('')
    const saveContextRef = useRef<{ noteId: string; workspaceId: string; note: NoteData } | null>(null)

    // Connect to Hocuspocus for real-time collaboration
    const {
        isReady,
        title: wsTitle,
        sendUpdateTitle,
        yDoc,
        yText
    } = useNoteCollab({
        noteId: noteId || '',
        workspaceId: currentWorkspaceId || '',
        enabled: !!noteId && !!currentWorkspaceId
    })

    // Always fetch note metadata from REST API
    // gcTime: 0 ensures stale content is not shown when navigating back to a note,
    // since content is the source of truth in Y.js (not the REST API snapshot).
    const { data: fetchedNote } = useQuery({
        queryKey: ['note', currentWorkspaceId, noteId],
        queryFn: () => getNote(currentWorkspaceId, noteId!),
        enabled: !!noteId && !!currentWorkspaceId,
        gcTime: 0,
    })

    // Reset note when navigating to a different note to avoid showing stale content
    useEffect(() => {
        setNote(null)
    }, [noteId])

    useEffect(() => {
        if (fetchedNote) {
            setNote(fetchedNote)
        }
    }, [fetchedNote])

    // Keep saveContextRef up to date for use in cleanup
    useEffect(() => {
        if (note?.id && noteId && currentWorkspaceId) {
            saveContextRef.current = { noteId, workspaceId: currentWorkspaceId, note }
        }
    }, [note, noteId, currentWorkspaceId])

    // Observe Y.js content changes and track the latest value in a ref.
    // This allows the cleanup to read the most recent content even after the Y.Doc is destroyed.
    useEffect(() => {
        if (!yText) return
        const initial = yText.get('data') as string
        if (initial) latestContentRef.current = initial
        const observer = () => {
            const content = yText.get('data') as string
            if (content) latestContentRef.current = content
        }
        yText.observe(observer)
        return () => yText.unobserve(observer)
    }, [yText])

    // Save current Y.js content to REST API when navigating away (noteId change or unmount).
    // This ensures the DB is always up to date before Hocuspocus's debounced onStoreDocument fires,
    // preventing stale content from being shown on the next visit.
    useEffect(() => {
        return () => {
            const content = latestContentRef.current
            const ctx = saveContextRef.current
            if (content && ctx) {
                updateNote(ctx.workspaceId, { ...ctx.note, id: ctx.noteId, content })
                    .catch(console.error)
            }
        }
    }, [noteId])

    // Sync WebSocket title changes back into React Query cache
    useEffect(() => {
        if (!wsTitle || !noteId || !currentWorkspaceId) return

        // Update single note cache
        queryClient.setQueryData(['note', currentWorkspaceId, noteId], (old: NoteData | undefined) => {
            if (!old) return old
            return { ...old, title: wsTitle }
        })

        // Update notes list cache (infinite query used by sidebar)
        queryClient.setQueriesData(
            { queryKey: ['notes', currentWorkspaceId], exact: false },
            (old: any) => {
                if (!old?.pages) return old
                return {
                    ...old,
                    pages: old.pages.map((page: NoteData[]) =>
                        page.map((n: NoteData) => n.id === noteId ? { ...n, title: wsTitle } : n)
                    )
                }
            }
        )
    }, [wsTitle, noteId, currentWorkspaceId, queryClient])

    return (
        <div className="flex flex-col bg-white dark:bg-neutral-800 xl:w-full h-full">
            <NoteDetailView
                note={note}
                menu={note ? <NoteDetailMenu note={note} /> : undefined}
                wsTitle={wsTitle}
                wsReady={isReady}
                onTitleChange={sendUpdateTitle}
                yDoc={yDoc}
                yText={yText}
            />
        </div>
    )
}

export default NoteDetailPage
