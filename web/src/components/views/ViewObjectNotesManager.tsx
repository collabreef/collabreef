import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Plus, X, FileText, Search, Trash2 } from "lucide-react"
import { getNotesForViewObject, addNoteToViewObject, removeNoteFromViewObject } from "@/api/view"
import { getNotes } from "@/api/note"
import { useToastStore } from "@/stores/toast"
import { Dialog } from "radix-ui"
import Renderer from "@/components/renderer/Renderer"

interface ViewObjectNotesManagerProps {
    workspaceId: string
    viewId: string
    viewObjectId: string
    viewObjectName: string
}

const ViewObjectNotesManager = ({
    workspaceId,
    viewId,
    viewObjectId,
    viewObjectName
}: ViewObjectNotesManagerProps) => {
    const { t } = useTranslation()
    const { addToast } = useToastStore()
    const queryClient = useQueryClient()
    const [isAddingNote, setIsAddingNote] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // Fetch linked notes
    const { data: linkedNotes = [], refetch: refetchLinkedNotes } = useQuery({
        queryKey: ['view-object-notes', workspaceId, viewId, viewObjectId],
        queryFn: () => getNotesForViewObject(workspaceId, viewId, viewObjectId),
        enabled: !!viewObjectId
    })

    // Fetch all workspace notes for selection
    const { data: allNotes = [] } = useQuery({
        queryKey: ['notes', workspaceId, searchQuery],
        queryFn: () => getNotes(workspaceId, 1, 100, searchQuery),
        enabled: isAddingNote
    })

    const addNoteMutation = useMutation({
        mutationFn: (noteId: string) => addNoteToViewObject(workspaceId, viewId, viewObjectId, noteId),
        onSuccess: () => {
            addToast({ title: t('views.noteAddedSuccess'), type: 'success' })
            refetchLinkedNotes()
            queryClient.invalidateQueries({ queryKey: ['view-object-notes', workspaceId, viewId, viewObjectId] })
            setIsAddingNote(false)
            setSearchQuery("")
        },
        onError: () => {
            addToast({ title: t('views.noteAddedError'), type: 'error' })
        }
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
    const availableNotes = Array.isArray(allNotes) ? allNotes.filter((note: any) => !linkedNoteIds.includes(note.id)) : []

    return (
        <div >

            {(
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={() => setIsAddingNote(true)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded text-sm"
                        title={t('views.addNote')}
                    >
                        <Plus size={14} />
                    </button>
                </div>
            )}

            {/* Linked Notes List */}
            {linkedNotes.length > 0 ? (
                <div className="space-y-2">
                    {linkedNotes.map((note: any) => (
                        <div
                            key={note.id}
                            className="flex flex-col rounded border py-4 group bg-white dark:bg-neutral-900"
                        >
                            <div>
                                
                            <button
                                onClick={() => removeNoteMutation.mutate(note.id)}
                                disabled={removeNoteMutation.isPending}
                                aria-label="delete"
                                className="px-4 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded disabled:opacity-50 flex-shrink-0 p-1"
                            >
                                <Trash2 size={12} />
                            </button>
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden max-h-16">
                                <div className="line-clamp-2 text-xs [&_.prose]:text-xs [&_.prose]:leading-tight">
                                    <Renderer content={note.content} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-gray-500 text-center py-4">
                    {t('views.noLinkedNotes')}
                </p>
            )}

            {/* Add Note Modal */}
            <Dialog.Root open={isAddingNote} onOpenChange={setIsAddingNote}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[600px] z-50 max-h-[85vh] overflow-y-auto">
                        <Dialog.Title className="text-xl font-semibold mb-4">
                            {t('views.addNoteToObject', { name: viewObjectName })}
                        </Dialog.Title>

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
                        <div className="space-y-2 max-h-96 overflow-y-auto">
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

                        <div className="mt-6 flex justify-end">
                            <Dialog.Close asChild>
                                <button className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                    {t('common.close')}
                                </button>
                            </Dialog.Close>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    )
}

export default ViewObjectNotesManager