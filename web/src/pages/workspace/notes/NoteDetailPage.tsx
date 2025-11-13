import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { useEffect, useState, useRef, useCallback, FC } from "react"
import { getNote, NoteData, updateNote } from "@/api/note"
import NoteDetailMenu from "@/components/notedetailmenu/NoteDetailMenu"
import { useTranslation } from "react-i18next"
import NoteDetailView from "@/components/notedetail/NoteDetailView"
import NoteDetailSidebar from "@/components/notedetailsidebar/NoteDetailSidebar"
import { TwoColumn, TwoColumnMain, TwoColumnSidebar, useTwoColumn } from "@/components/twocolumn"
import { toast } from "@/stores/toast"
import { Info } from "lucide-react"

const NoteDetailPage = () => {
    const [note, setNote] = useState<NoteData | null>(null)
    const currentWorkspaceId = useCurrentWorkspaceId()
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
        }
    }, [fetchedNote])

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
            <NoteDetailContent
                note={note}
                t={t}
                handleNoteChange={handleNoteChange}
            />
        </TwoColumn>
    )
}

interface NoteDetailContentProps {
    note: NoteData | null
    t: any
    handleNoteChange: (data: any) => void
}

const NoteDetailContent: FC<NoteDetailContentProps> = ({ note, t, handleNoteChange }) => {
    const { toggleSidebar } = useTwoColumn()

    return (
        <>
            <TwoColumnMain
                className="bg-white dark:bg-[#222] text-neutral-800 dark:text-gray-400"
            >
                <NoteDetailView
                    note={note}
                    menu={
                        note ? (
                            <div className="flex items-center gap-2">
                                
                                <NoteDetailMenu note={note} />
                            </div>
                        ) : undefined
                    }
                    isEditable={true}
                    onChange={handleNoteChange}
                />
            </TwoColumnMain>
            <TwoColumnSidebar>
                {note && <NoteDetailSidebar note={note} onClose={toggleSidebar} />}
            </TwoColumnSidebar>
        </>
    )
}

export default NoteDetailPage
