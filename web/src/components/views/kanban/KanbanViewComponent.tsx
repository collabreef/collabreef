import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { KanbanColumnData, KanbanViewData, View } from '../../../types/view'
import { getNotesForViewObject, removeNoteFromViewObject, addNoteToViewObject, deleteViewObject, updateViewObject, updateView } from '../../../api/view'
import { PlusCircle, MoreVertical, Edit2, Trash2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Dialog } from 'radix-ui'
import AddNoteDialog from '../AddNoteDialog'
import { useToastStore } from '../../../stores/toast'
import { useTranslation } from 'react-i18next'
import Renderer from '../../renderer/Renderer'

interface KanbanViewComponentProps {
    view?: View
    viewObjects?: any[] // columns
    focusedObjectId?: string
    isPublic?: boolean
    workspaceId?: string
    viewId?: string
}

const KanbanViewComponent = ({
    view,
    viewObjects = [],
    focusedObjectId,
    isPublic = false,
    workspaceId,
    viewId
}: KanbanViewComponentProps) => {
    const navigate = useNavigate()
    const params = useParams<{ workspaceId?: string; viewId?: string }>()
    const queryClient = useQueryClient()
    const { addToast } = useToastStore()
    const { t } = useTranslation()
    const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [editingColor, setEditingColor] = useState('')

    const currentWorkspaceId = workspaceId || params.workspaceId
    const currentViewId = viewId || params.viewId

    // Sort columns by order from view data
    const sortedColumns = useMemo(() => {
        // Try to get column order from view.data
        let viewData: KanbanViewData | null = null
        if (view?.data) {
            try {
                viewData = JSON.parse(view.data)
            } catch (e) {
                console.error('Failed to parse view data:', e)
            }
        }

        // If view has columns order, use it
        if (viewData?.columns && viewData.columns.length > 0) {
            const orderMap = new Map(viewData.columns.map((id, index) => [id, index]))
            return [...viewObjects].sort((a, b) => {
                const orderA = orderMap.get(a.id) ?? 999
                const orderB = orderMap.get(b.id) ?? 999
                return orderA - orderB
            })
        }

        // Fallback to old sorting by viewObject.data.order for backward compatibility
        return [...viewObjects].sort((a, b) => {
            try {
                const dataA: any = a.data ? JSON.parse(a.data) : {}
                const dataB: any = b.data ? JSON.parse(b.data) : {}
                const orderA = dataA.order ?? 999
                const orderB = dataB.order ?? 999
                return orderA - orderB
            } catch (e) {
                return 0
            }
        })
    }, [viewObjects, view])

    const handleNoteClick = (noteId: string) => {
        const path = isPublic
            ? `/share/notes/${noteId}`
            : `/workspaces/${currentWorkspaceId}/notes/${noteId}`
        navigate(path)
    }

    const moveNoteMutation = useMutation({
        mutationFn: async ({ noteId, fromColumnId, toColumnId }: { noteId: string, fromColumnId: string, toColumnId: string }) => {
            // First remove from old column
            await removeNoteFromViewObject(currentWorkspaceId!, currentViewId!, fromColumnId, noteId)
            // Then add to new column
            await addNoteToViewObject(currentWorkspaceId!, currentViewId!, toColumnId, noteId)
        },
        onSuccess: (_, variables) => {
            // Invalidate both columns' note queries
            queryClient.invalidateQueries({ queryKey: ['column-notes', currentWorkspaceId, currentViewId, variables.fromColumnId] })
            queryClient.invalidateQueries({ queryKey: ['column-notes', currentWorkspaceId, currentViewId, variables.toColumnId] })
        },
        onError: () => {
            addToast({ title: t('views.noteMovedError'), type: 'error' })
        }
    })

    const handleMoveNote = async (noteId: string, fromColumnId: string, toColumnId: string) => {
        if (!currentWorkspaceId || !currentViewId) return
        moveNoteMutation.mutate({ noteId, fromColumnId, toColumnId })
    }

    const deleteColumnMutation = useMutation({
        mutationFn: async (columnId: string) => {
            // Delete the view object
            await deleteViewObject(currentWorkspaceId!, currentViewId!, columnId)

            // Also remove from view.data.columns if it exists
            if (view?.data) {
                try {
                    const viewData: KanbanViewData = JSON.parse(view.data)
                    if (viewData.columns) {
                        const newColumns = viewData.columns.filter(id => id !== columnId)
                        const newViewData: KanbanViewData = {
                            ...viewData,
                            columns: newColumns
                        }
                        await updateView(currentWorkspaceId!, currentViewId!, {
                            data: JSON.stringify(newViewData)
                        })
                    }
                } catch (e) {
                    console.error('Failed to update view data after deleting column:', e)
                }
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['view-objects', currentWorkspaceId, currentViewId] })
            queryClient.invalidateQueries({ queryKey: ['view', currentWorkspaceId, currentViewId] })
        },
        onError: () => {
            addToast({ title: t('views.objectDeletedError'), type: 'error' })
        }
    })

    const updateColumnMutation = useMutation({
        mutationFn: ({ columnId, name, data }: { columnId: string, name: string, data: string }) =>
            updateViewObject(currentWorkspaceId!, currentViewId!, columnId, { name, data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['view-objects', currentWorkspaceId, currentViewId] })
            setEditingColumnId(null)
            setEditingName('')
            setEditingColor('')
        },
        onError: () => {
            addToast({ title: t('views.objectUpdatedError'), type: 'error' })
        }
    })

    const handleEditColumn = (columnId: string) => {
        const column = sortedColumns.find(col => col.id === columnId)
        if (column) {
            setEditingColumnId(columnId)
            setEditingName(column.name)
            try {
                const columnData: KanbanColumnData = column.data ? JSON.parse(column.data) : {}
                setEditingColor(columnData.color || '')
            } catch (e) {
                setEditingColor('')
            }
        }
    }

    const handleSaveEdit = () => {
        if (!editingColumnId || !editingName.trim()) return

        const column = sortedColumns.find(col => col.id === editingColumnId)
        if (!column) return

        try {
            const existingData: KanbanColumnData = column.data ? JSON.parse(column.data) : {}
            const newData: KanbanColumnData = {
                ...existingData,
                color: editingColor || undefined
            }

            updateColumnMutation.mutate({
                columnId: editingColumnId,
                name: editingName.trim(),
                data: JSON.stringify(newData)
            })
        } catch (e) {
            addToast({ title: t('views.objectUpdatedError'), type: 'error' })
        }
    }

    const handleDeleteColumn = (columnId: string) => {
        if (window.confirm(t('views.deleteObjectConfirm'))) {
            deleteColumnMutation.mutate(columnId)
        }
    }

    const handleMoveColumn = async (columnId: string, direction: 'forward' | 'backward') => {
        if (!view || !currentWorkspaceId || !currentViewId) return

        const currentIndex = sortedColumns.findIndex(col => col.id === columnId)
        if (currentIndex === -1) return

        const targetIndex = direction === 'forward' ? currentIndex - 1 : currentIndex + 1
        if (targetIndex < 0 || targetIndex >= sortedColumns.length) return

        try {
            // Get current view data
            let viewData: KanbanViewData = {}
            if (view.data) {
                try {
                    viewData = JSON.parse(view.data)
                } catch (e) {
                    console.error('Failed to parse view data:', e)
                }
            }

            // Get current columns order (from view data or sorted columns)
            let columns = viewData.columns || sortedColumns.map(col => col.id)

            // Swap the columns
            const newColumns = [...columns]
            ;[newColumns[currentIndex], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[currentIndex]]

            // Update view data
            const newViewData: KanbanViewData = {
                ...viewData,
                columns: newColumns
            }

            await updateView(currentWorkspaceId, currentViewId, {
                data: JSON.stringify(newViewData)
            })

            // Refresh the view query
            queryClient.invalidateQueries({ queryKey: ['view', currentWorkspaceId, currentViewId] })
        } catch (e) {
            addToast({ title: t('views.objectUpdatedError'), type: 'error' })
        }
    }

    return (
        <>
            <div className="h-full overflow-x-auto">
                <div className="flex gap-4 h-full min-w-max">
                    {sortedColumns.map((column, index) => (
                        <KanbanColumn
                            key={column.id}
                            column={column}
                            isFocused={column.id === focusedObjectId}
                            isPublic={isPublic}
                            workspaceId={currentWorkspaceId}
                            viewId={currentViewId}
                            onNoteClick={handleNoteClick}
                            onMoveNote={handleMoveNote}
                            onEditColumn={handleEditColumn}
                            onDeleteColumn={handleDeleteColumn}
                            onMoveColumn={handleMoveColumn}
                            isFirstColumn={index === 0}
                            isLastColumn={index === sortedColumns.length - 1}
                        />
                    ))}

                    {sortedColumns.length === 0 && (
                        <div className="flex items-center justify-center w-full h-full text-neutral-400 dark:text-neutral-500">
                            No columns yet. Create your first column to get started.
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Column Dialog */}
            <Dialog.Root open={!!editingColumnId} onOpenChange={(open) => !open && setEditingColumnId(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[400px] z-50">
                        <Dialog.Title className="text-xl font-semibold mb-4">
                            {t('views.editColumn')}
                        </Dialog.Title>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('views.columnName')}
                                </label>
                                <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="w-full px-3 py-2 border dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                                    placeholder={t('views.enterName')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    {t('views.color')}
                                </label>
                                <input
                                    type="color"
                                    value={editingColor || '#3b82f6'}
                                    onChange={(e) => setEditingColor(e.target.value)}
                                    className="w-full h-10 border dark:border-neutral-600 rounded-lg cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <Dialog.Close asChild>
                                <button className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                    {t('common.cancel')}
                                </button>
                            </Dialog.Close>
                            <button
                                onClick={handleSaveEdit}
                                disabled={updateColumnMutation.isPending || !editingName.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updateColumnMutation.isPending ? t('common.saving') : t('common.save')}
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    )
}

interface KanbanColumnProps {
    column: any
    isFocused: boolean
    isPublic: boolean
    workspaceId?: string
    viewId?: string
    onNoteClick: (noteId: string) => void
    onMoveNote: (noteId: string, fromColumnId: string, toColumnId: string) => Promise<void>
    onEditColumn?: (columnId: string) => void
    onDeleteColumn?: (columnId: string) => void
    onMoveColumn?: (columnId: string, direction: 'forward' | 'backward') => void
    isFirstColumn?: boolean
    isLastColumn?: boolean
}

const KanbanColumn = ({ column, isPublic, workspaceId, viewId, onNoteClick, onMoveNote, onEditColumn, onDeleteColumn, onMoveColumn, isFirstColumn, isLastColumn }: KanbanColumnProps) => {
    const [isAddingNote, setIsAddingNote] = useState(false)
    const [_, setIsDragOver] = useState(false)
    const { t } = useTranslation()
    const { addToast } = useToastStore()
    const queryClient = useQueryClient()

    let columnData: KanbanColumnData = {}
    try {
        if (column.data) {
            columnData = JSON.parse(column.data)
        }
    } catch (e) {
        console.error('Failed to parse column data:', e)
    }

    // Fetch notes for this column
    const { data: notes = [], refetch: refetchNotes } = useQuery({
        queryKey: ['column-notes', workspaceId, viewId, column.id],
        queryFn: () => isPublic
            ? import('../../../api/view').then(m => m.getPublicNotesForViewObject(viewId!, column.id))
            : getNotesForViewObject(workspaceId!, viewId!, column.id),
        enabled: isPublic ? !!viewId : (!!workspaceId && !!viewId)
    })

    const linkedNoteIds = Array.isArray(notes) ? notes.map((note: any) => note.id) : []

    // Remove note mutation
    const removeNoteMutation = useMutation({
        mutationFn: async (noteId: string) => {
            await removeNoteFromViewObject(workspaceId!, viewId!, column.id, noteId)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['column-notes', workspaceId, viewId, column.id] })
        },
        onError: () => {
            addToast({ title: t('views.noteRemovedError'), type: 'error' })
        }
    })

    const handleRemoveNote = (e: React.MouseEvent, noteId: string) => {
        e.stopPropagation()
        if (window.confirm(t('views.removeNoteConfirm'))) {
            removeNoteMutation.mutate(noteId)
        }
    }

    // Drag and drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)

        const noteId = e.dataTransfer.getData('noteId')
        const fromColumnId = e.dataTransfer.getData('fromColumnId')

        if (noteId && fromColumnId && fromColumnId !== column.id) {
            await onMoveNote(noteId, fromColumnId, column.id)
        }
    }

    return (
        <div
            className={`flex-shrink-0 w-80 h-[calc(100dvh-80px)] bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 transition-all`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Column Header */}
            <div className="w-full text-left mb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {columnData.color && (
                            <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: columnData.color }}
                            ></div>
                        )}
                        <div className="font-semibold text-lg">
                            {column.name}
                        </div>
                        <div className="text-sm text-neutral-500 dark:text-neutral-400">
                            {notes.length}
                        </div>
                    </div>
                    {!isPublic && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsAddingNote(true)
                                }}
                                className="p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                                title={t('views.addNote')}
                            >
                                <PlusCircle size={16} />
                            </button>
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                    <button
                                        className="p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                                        title={t('common.more')}
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Portal>
                                    <DropdownMenu.Content
                                        className="min-w-[160px] bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 p-1 z-50"
                                        sideOffset={5}
                                    >
                                        {!isFirstColumn && (
                                            <DropdownMenu.Item
                                                className="flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer outline-none hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                                onSelect={() => onMoveColumn?.(column.id, 'forward')}
                                            >
                                                <ChevronLeft size={14} />
                                                {t('actions.moveForward')}
                                            </DropdownMenu.Item>
                                        )}
                                        {!isLastColumn && (
                                            <DropdownMenu.Item
                                                className="flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer outline-none hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                                onSelect={() => onMoveColumn?.(column.id, 'backward')}
                                            >
                                                <ChevronRight size={14} />
                                                {t('actions.moveBackward')}
                                            </DropdownMenu.Item>
                                        )}
                                        {(!isFirstColumn || !isLastColumn) && (
                                            <DropdownMenu.Separator className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />
                                        )}
                                        <DropdownMenu.Item
                                            className="flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer outline-none hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                            onSelect={() => onEditColumn?.(column.id)}
                                        >
                                            <Edit2 size={14} />
                                            {t('actions.edit')}
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item
                                            className="flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer outline-none text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            onSelect={() => onDeleteColumn?.(column.id)}
                                        >
                                            <Trash2 size={14} />
                                            {t('actions.delete')}
                                        </DropdownMenu.Item>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                        </div>
                    )}
                </div>
            </div>

            {/* Notes (Cards) */}
            <div className="space-y-3 h-[calc(100dvh-150px)] overflow-x-hidden overflow-y-auto">
                {notes.map((note: any) => (
                    <div
                        key={note.id}
                        draggable={!isPublic}
                        onDragStart={(e) => {
                            e.dataTransfer.setData('noteId', note.id)
                            e.dataTransfer.setData('fromColumnId', column.id)
                        }}
                        onClick={() => onNoteClick(note.id)}
                        className="w-full text-left p-4 pr-8 rounded-lg bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 cursor-pointer relative"
                    >
                        {!isPublic && (
                            <button
                                onClick={(e) => handleRemoveNote(e, note.id)}
                                className="absolute top-2 right-2 p-1 text-neutral-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                title={t('views.removeNote')}
                            >
                                <X size={14} />
                            </button>
                        )}
                        <div className="text-sm line-clamp-3 overflow-hidden [&_.prose]:text-sm [&_.prose]:leading-normal">
                            <Renderer content={note.content} />
                        </div>
                    </div>
                ))}

                {notes.length === 0 && (
                    <div className="text-center py-8 text-neutral-400 dark:text-neutral-500 text-sm">
                        No notes
                    </div>
                )}
            </div>

            {/* Add Note Dialog */}
            {!isPublic && workspaceId && viewId && (
                <AddNoteDialog
                    workspaceId={workspaceId}
                    viewId={viewId}
                    viewObjectId={column.id}
                    viewObjectName={column.name}
                    isOpen={isAddingNote}
                    onOpenChange={setIsAddingNote}
                    linkedNoteIds={linkedNoteIds}
                    onSuccess={refetchNotes}
                />
            )}
        </div>
    )
}

export default KanbanViewComponent
