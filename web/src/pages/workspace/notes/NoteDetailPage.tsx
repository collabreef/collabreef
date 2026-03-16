import { useQuery } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { useEffect, useState } from "react"
import { getNote, NoteData } from "@/api/note"
import NoteDetailView from "@/components/notedetail/NoteDetailView"
import { useNoteCollab } from "@/hooks/use-note-collab"
import NoteDetailMenu from "@/components/notedetailmenu/NoteDetailMenu"

const NoteDetailPage = () => {
    const [note, setNote] = useState<NoteData | null>(null)
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { noteId } = useParams()

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
    const { data: fetchedNote } = useQuery({
        queryKey: ['note', currentWorkspaceId, noteId],
        queryFn: () => getNote(currentWorkspaceId, noteId!),
        enabled: !!noteId && !!currentWorkspaceId,
    })

    useEffect(() => {
        if (fetchedNote) {
            setNote(fetchedNote)
        }
    }, [fetchedNote])

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
