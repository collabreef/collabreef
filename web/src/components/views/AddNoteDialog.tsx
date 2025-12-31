import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Search, FilePlus } from "lucide-react"
import { addNoteToViewObject } from "@/api/view"
import { getNotes, createNote } from "@/api/note"
import { useToastStore } from "@/stores/toast"
import { Dialog } from "radix-ui"
import Renderer from "@/components/renderer/Renderer"
import { useNavigate } from "react-router-dom"

interface AddNoteDialogProps {
    workspaceId: string
    viewId: string
    viewObjectId: string
    viewObjectName: string
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    linkedNoteIds?: string[]
    onSuccess?: () => void
    inline?: boolean // New prop for inline mode
}

const AddNoteDialog = ({
    workspaceId,
    viewId,
    viewObjectId,
    viewObjectName,
    isOpen,
    onOpenChange,
    linkedNoteIds = [],
    onSuccess,
    inline = false
}: AddNoteDialogProps) => {
    const { t } = useTranslation()
    const { addToast } = useToastStore()
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")

    // Fetch all workspace notes for selection
    const { data: allNotes = [] } = useQuery({
        queryKey: ['notes', workspaceId, searchQuery],
        queryFn: () => getNotes(workspaceId, 1, 100, searchQuery),
        enabled: isOpen
    })

    const addNoteMutation = useMutation({
        mutationFn: (noteId: string) => addNoteToViewObject(workspaceId, viewId, viewObjectId, noteId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['view-object-notes', workspaceId, viewId, viewObjectId] })
            queryClient.invalidateQueries({ queryKey: ['column-notes', workspaceId, viewId, viewObjectId] })
            onOpenChange(false)
            setSearchQuery("")
            onSuccess?.()
        },
        onError: () => {
            addToast({ title: t('views.noteAddedError'), type: 'error' })
        }
    })

    const createAndLinkNoteMutation = useMutation({
        mutationFn: async () => {
            // Create a valid empty TipTap document
            const emptyContent = JSON.stringify({
                type: "doc",
                content: []
            })

            // First create the note
            const newNote = await createNote(workspaceId, {
                content: emptyContent,
                visibility: "private"
            })
            // Then link it to the view object
            await addNoteToViewObject(workspaceId, viewId, viewObjectId, newNote.id)
            return newNote
        },
        onSuccess: (newNote) => {
            queryClient.invalidateQueries({ queryKey: ['view-object-notes', workspaceId, viewId, viewObjectId] })
            queryClient.invalidateQueries({ queryKey: ['column-notes', workspaceId, viewId, viewObjectId] })
            onSuccess?.()
            // Navigate to the note detail page
            navigate(`/workspaces/${workspaceId}/notes/${newNote.id}?mode=edit`)
        },
        onError: () => {
            addToast({ title: t('views.noteCreateError'), type: 'error' })
        }
    })

    const availableNotes = Array.isArray(allNotes) ? allNotes.filter((note: any) => !linkedNoteIds.includes(note.id)) : []

    const dialogContent = (
        <>
            {/* Create New Note Button */}
            <button
                onClick={() => createAndLinkNoteMutation.mutate()}
                disabled={createAndLinkNoteMutation.isPending}
                className="w-full mb-4 px-4 py-3 bg-black text-white rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <FilePlus size={18} />
                {createAndLinkNoteMutation.isPending ? t('common.creating') : t('views.createNewNote')}
            </button>

            <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t dark:border-neutral-600"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-white dark:bg-neutral-800 px-2 text-gray-500">
                        {t('views.orLinkExisting')}
                    </span>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('views.searchNotes')}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                    />
                </div>
            </div>

            {/* Notes List */}
            <div className="space-y-2 overflow-y-auto">
                {availableNotes.length > 0 ? (
                    availableNotes.map((note: any) => (
                        <button
                            key={note.id}
                            onClick={() => addNoteMutation.mutate(note.id)}
                            disabled={addNoteMutation.isPending}
                            className="w-full text-left p-3 border dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-50"
                        >
                            <div className="text-sm line-clamp-3 mb-2 overflow-hidden [&_.prose]:text-sm [&_.prose]:leading-normal">
                                <Renderer content={note.content} />
                            </div>
                            <p className="text-xs text-gray-500">
                                {new Date(note.created_at).toLocaleDateString()}
                            </p>
                        </button>
                    ))
                ) : (
                    <p className="text-center text-gray-500 py-8">
                        {searchQuery ? t('views.noNotesFound') : t('views.allNotesLinked')}
                    </p>
                )}
            </div>

            {!inline && (
                <div className="mt-6 flex justify-end">
                    <Dialog.Close asChild>
                        <button className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                            {t('common.close')}
                        </button>
                    </Dialog.Close>
                </div>
            )}
        </>
    )

    if (inline) {
        return <div className="space-y-4">{dialogContent}</div>
    }

    return (
        <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[600px] z-50 max-h-[85vh] overflow-y-auto">
                    <Dialog.Title className="text-xl font-semibold mb-4">
                        {t('views.addNoteToObject', { name: viewObjectName })}
                    </Dialog.Title>
                    {dialogContent}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default AddNoteDialog
