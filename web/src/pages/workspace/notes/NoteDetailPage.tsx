import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { useEffect, useState, useRef, useCallback } from "react"
import { getNote, NoteData, updateNote } from "@/api/note"
import NoteDetailMenu from "@/components/notedetailmenu/NoteDetailMenu"
import { useCurrentUserStore } from "@/stores/current-user"
import { useTranslation } from "react-i18next"
import NoteDetailView from "@/components/notedetail/NoteDetailView"
import { TwoColumn, TwoColumnMain, TwoColumnSidebar } from "@/components/twocolumn"
import { toast } from "@/stores/toast"

const NoteDetailPage = () => {
    const [_, setIsLoading] = useState<boolean>(true)
    const [note, setNote] = useState<NoteData | null>(null)
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { user } = useCurrentUserStore()
    const { noteId } = useParams()
    const { t } = useTranslation()
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const queryClient = useQueryClient()

    const { data: fetchedNote } = useQuery({
        queryKey: ['note', currentWorkspaceId, noteId],
        queryFn: () => getNote(currentWorkspaceId, noteId!),
        enabled: !!noteId && !!currentWorkspaceId,
    })

    const updateNoteMutation = useMutation({
        mutationFn: (data: NoteData) => updateNote(currentWorkspaceId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['note', currentWorkspaceId, noteId] })
            queryClient.invalidateQueries({ queryKey: ['notes', currentWorkspaceId] })
        },
        onError: (error) => {
            toast.error(t("messages.saveNoteFailed"))
            console.error("Failed to save note:", error)
        }
    })

    const handleNoteChange = useCallback((data: any) => {
        if (!note || !noteId) return

        const updatedNote = {
            ...note,
            ...data
        }

        setNote(updatedNote)

        // Clear previous timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        // Set new timeout for auto-save (debounced by 1 second)
        saveTimeoutRef.current = setTimeout(() => {
            updateNoteMutation.mutate({
                id: noteId,
                ...updatedNote
            })
        }, 1000)
    }, [note, noteId, updateNoteMutation])

    useEffect(() => {
        if (fetchedNote) {
            setNote(fetchedNote)
            setIsLoading(false)
        } else if (!noteId) {
            setIsLoading(false)
        }
    }, [fetchedNote, noteId])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
        }
    }, [])

    return (
        <TwoColumn>
            <TwoColumnMain>
                <NoteDetailView
                    note={note}
                    backLink=".."
                    title={t("pages.noteDetail.note")}
                    authorName={user?.name}
                    menu={note ? <NoteDetailMenu note={note} /> : undefined}
                    isEditable={true}
                    onChange={handleNoteChange}
                />
            </TwoColumnMain>
            <TwoColumnSidebar>
                <div className="w-96">
                    
                </div>
            </TwoColumnSidebar>
        </TwoColumn>
    )
}

export default NoteDetailPage
