import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Trash2 } from "lucide-react"
import { getNotesForViewObject, removeNoteFromViewObject } from "@/api/view"
import { useToastStore } from "@/stores/toast"
import Renderer from "@/components/renderer/Renderer"
import NoteTime from "@/components/notetime/NoteTime"
import { Link } from "react-router-dom"
import AddNoteDialog from "./AddNoteDialog"

interface ViewObjectNotesManagerProps {
    workspaceId: string
    viewId: string
    viewObjectId: string
    viewObjectName: string
    isAddingNote: boolean
    setIsAddingNote: (value: boolean) => void
}

const ViewObjectNotesManager = ({
    workspaceId,
    viewId,
    viewObjectId,
    viewObjectName,
    isAddingNote,
    setIsAddingNote
}: ViewObjectNotesManagerProps) => {
    const { t } = useTranslation()
    const { addToast } = useToastStore()
    const queryClient = useQueryClient()

    // Fetch linked notes
    const { data: linkedNotes = [], refetch: refetchLinkedNotes } = useQuery({
        queryKey: ['view-object-notes', workspaceId, viewId, viewObjectId],
        queryFn: () => getNotesForViewObject(workspaceId, viewId, viewObjectId),
        enabled: !!viewObjectId
    })

    const removeNoteMutation = useMutation({
        mutationFn: (noteId: string) => removeNoteFromViewObject(workspaceId, viewId, viewObjectId, noteId),
        onSuccess: () => {
            addToast({ title: t('views.noteRemovedSuccess'), type: 'success' })
            refetchLinkedNotes()
            queryClient.invalidateQueries({ queryKey: ['view-object-notes', workspaceId, viewId, viewObjectId] })
        },
        onError: () => {
            addToast({ title: t('views.noteRemovedError'), type: 'error' })
        }
    })

    const linkedNoteIds = Array.isArray(linkedNotes) ? linkedNotes.map((note: any) => note.id) : []

    return (
        <div>
            {/* Linked Notes List */}
            {linkedNotes.length > 0 ? (
                <div className="space-y-2 p-4">
                    {linkedNotes.map((note: any) => (
                        <Link
                            to={`/workspaces/${workspaceId}/notes/${note.id}`}
                            key={note.id}
                            className="flex flex-col gap-2 p-3 rounded shadow-sm group bg-white dark:bg-neutral-800 relative"
                        >
                            <div className="flex justify-between">
                                <div className="">
                                    <NoteTime time={note.created_at} />
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        removeNoteMutation.mutate(note.id)
                                    }}
                                    disabled={removeNoteMutation.isPending}
                                    aria-label="delete"
                                    className="relative z-10 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded disabled:opacity-50 flex-shrink-0 p-1"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                            <div className="line-clamp-2 ">
                                <Renderer content={note.content} />
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-gray-500 text-center py-4">
                    {t('views.noLinkedNotes')}
                </p>
            )}

            {/* Add Note Dialog */}
            <AddNoteDialog
                workspaceId={workspaceId}
                viewId={viewId}
                viewObjectId={viewObjectId}
                viewObjectName={viewObjectName}
                isOpen={isAddingNote}
                onOpenChange={setIsAddingNote}
                linkedNoteIds={linkedNoteIds}
                onSuccess={refetchLinkedNotes}
            />
        </div>
    )
}

export default ViewObjectNotesManager