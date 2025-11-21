import { FC, useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteNote, NoteData, updateNoteVisibility } from "@/api/note"
import { getViewObjectsForNote, getPublicViewObjectsForNote, getViews, getViewObjects, addNoteToViewObject, createViewObject } from "@/api/view"
import { useTranslation } from "react-i18next"
import { ChevronRight, ChevronDown, Calendar, MapPin, Pin, Search, Plus, Trash2, Globe, Building, Lock } from "lucide-react"
import { CalendarSlotData, MapMarkerData, ViewObject, ViewObjectType } from "@/types/view"
import MiniCalendarView from "./MiniCalendarView"
import MiniMapView from "./MiniMapView"
import { Link, useParams, useNavigate } from "react-router-dom"
import * as Dialog from "@radix-ui/react-dialog"
import * as Accordion from "@radix-ui/react-accordion"
import { useToastStore } from "@/stores/toast"
import CreateViewObjectModal from "@/components/views/CreateViewObjectModal"
import { Visibility } from "@/types/visibility"

interface NoteDetailSidebarProps {
    note: NoteData
}

const NoteDetailSidebar: FC<NoteDetailSidebarProps> = ({ note }) => {
    const { t } = useTranslation()
    const { workspaceId } = useParams<{ workspaceId?: string }>()
    const { addToast } = useToastStore()
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const [isPinning, setIsPinning] = useState(false)
    const [isVisibilitySelecting, setIsVisibilitySelecting] = useState(false)
    const [selectedViewId, setSelectedViewId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreatingObject, setIsCreatingObject] = useState(false)
    const [newObjectName, setNewObjectName] = useState("")
    const [newObjectData, setNewObjectData] = useState("")

    // Delete note mutation
    const deleteNoteMutation = useMutation({
        mutationFn: () => {
            if (!workspaceId || !note.id) throw new Error('Missing required parameters')
            return deleteNote(workspaceId, note.id)
        },
        onSuccess: async () => {
            try {
                await queryClient.invalidateQueries({ queryKey: ['notes', workspaceId] })
                navigate(`/workspaces/${workspaceId}`)
                addToast({ title: t('messages.noteDeleted') || 'Note deleted', type: 'success' })
            } catch (error) {
                addToast({ title: t('messages.deleteNoteFailed') || 'Failed to delete note', type: 'error' })
            }
        },
    })

    // Update visibility mutation
    const updateVisibilityMutation = useMutation({
        mutationFn: (visibility: Visibility) => {
            if (!workspaceId || !note.id) throw new Error('Missing required parameters')
            return updateNoteVisibility(workspaceId, note.id, visibility)
        },
        onSuccess: async () => {
            try {
                await queryClient.invalidateQueries({ queryKey: ['note', workspaceId, note.id] })
                addToast({ title: t('messages.visibilityUpdated') || 'Visibility updated', type: 'success' })
            } catch (error) {
                addToast({ title: t('messages.updateVisibilityFailed') || 'Failed to update visibility', type: 'error' })
            }
        },
    })

    // Get icon for visibility
    const getVisibilityIcon = (visibility?: Visibility) => {
        switch (visibility) {
            case 'private':
                return <Lock size={16} />
            case 'workspace':
                return <Building size={16} />
            case 'public':
                return <Globe size={16} />
        }
    }

    const handleDelete = () => {
        if (confirm(t('messages.confirmDelete') || 'Are you sure you want to delete this note?')) {
            deleteNoteMutation.mutate()
        }
    }

    const handleUpdateVisibility = (visibility: Visibility) => {
        // Don't update if it's the same visibility
        if (visibility === note.visibility) {
            setIsVisibilitySelecting(false)
            return
        }

        updateVisibilityMutation.mutate(visibility)
        setIsVisibilitySelecting(false)
    }

    // Use public endpoint when viewing from explore page (no workspaceId in URL)
    // Use workspace endpoint when viewing from workspace context
    const { data: viewObjects = [], refetch: refetchViewObjects } = useQuery({
        queryKey: workspaceId
            ? ['note-view-objects', workspaceId, note.id]
            : ['public-note-view-objects', note.id],
        queryFn: () => {
            if (workspaceId && note.id) {
                return getViewObjectsForNote(workspaceId, note.id)
            } else if (note.id) {
                return getPublicViewObjectsForNote(note.id)
            }
            return Promise.resolve([])
        },
        enabled: !!note.id,
    })

    // Fetch all views when pin dialog is open
    const { data: allViews = [] } = useQuery({
        queryKey: ['views', workspaceId],
        queryFn: () => workspaceId ? getViews(workspaceId, 1, 100) : Promise.resolve([]),
        enabled: isPinning && !!workspaceId
    })

    // Fetch view objects for selected view
    const { data: selectedViewObjects = [] } = useQuery({
        queryKey: ['view-objects', workspaceId, selectedViewId],
        queryFn: () => workspaceId && selectedViewId ? getViewObjects(workspaceId, selectedViewId, 1, 100) : Promise.resolve([]),
        enabled: !!selectedViewId && !!workspaceId
    })

    // Add note to view object mutation
    const pinNoteMutation = useMutation({
        mutationFn: ({ viewId, objectId }: { viewId: string, objectId: string }) => {
            if (!workspaceId || !note.id) throw new Error('Missing required parameters')
            return addNoteToViewObject(workspaceId, viewId, objectId, note.id)
        },
        onSuccess: () => {
            addToast({ title: t('views.noteAddedSuccess'), type: 'success' })
            refetchViewObjects()
            queryClient.invalidateQueries({ queryKey: ['note-view-objects', workspaceId, note.id] })
            setIsPinning(false)
            setSelectedViewId(null)
            setSearchQuery("")
        },
        onError: () => {
            addToast({ title: t('views.noteAddedError'), type: 'error' })
        }
    })

    // Get selected view
    const selectedView = useMemo(() => {
        return allViews.find(v => v.id === selectedViewId)
    }, [allViews, selectedViewId])

    // Determine the object type based on view type
    const getObjectType = (): ViewObjectType => {
        if (selectedView?.type === 'calendar') return 'calendar_slot'
        if (selectedView?.type === 'map') return 'map_marker'
        return 'calendar_slot' // default
    }

    // Create view object and link to note mutation
    const createAndLinkMutation = useMutation({
        mutationFn: async (data: { name: string; data: string }) => {
            if (!workspaceId || !selectedViewId || !note.id) throw new Error('Missing required parameters')
            // First create the view object
            const newObject = await createViewObject(workspaceId, selectedViewId, {
                name: data.name,
                type: getObjectType(),
                data: data.data
            })
            // Then link it to the note
            await addNoteToViewObject(workspaceId, selectedViewId, newObject.id, note.id)
            return newObject
        },
        onSuccess: () => {
            addToast({ title: t('views.noteCreatedAndLinked') || 'Object created and linked successfully', type: 'success' })
            refetchViewObjects()
            queryClient.invalidateQueries({ queryKey: ['note-view-objects', workspaceId, note.id] })
            queryClient.invalidateQueries({ queryKey: ['view-objects', workspaceId, selectedViewId] })
            setIsCreatingObject(false)
            setNewObjectName("")
            setNewObjectData("")
            setIsPinning(false)
            setSelectedViewId(null)
            setSearchQuery("")
        },
        onError: () => {
            addToast({ title: t('views.objectCreatedError'), type: 'error' })
        }
    })

    const handleCreateObject = () => {
        if (newObjectName.trim()) {
            createAndLinkMutation.mutate({ name: newObjectName.trim(), data: newObjectData })
        }
    }

    // Group view objects by view and filter out private views
    const groupedByView = useMemo(() => {
        const grouped = new Map()

        viewObjects.forEach(item => {
            // Only include views that are public or workspace-visible
            // Skip private views when viewing from explore page (no workspace context)
            if (!workspaceId && item.view.visibility === 'private') {
                return
            }

            const viewId = item.view.id
            if (!grouped.has(viewId)) {
                grouped.set(viewId, {
                    view: item.view,
                    viewObjects: []
                })
            }
            grouped.get(viewId).viewObjects.push(item.view_object)
        })

        return Array.from(grouped.values())
    }, [viewObjects, workspaceId])

    // Get already linked view object IDs
    const linkedViewObjectIds = useMemo(() => {
        return viewObjects.map(item => item.view_object.id)
    }, [viewObjects])

    // Filter view objects that are not already linked
    const availableViewObjects = useMemo(() => {
        return selectedViewObjects.filter(obj => !linkedViewObjectIds.includes(obj.id))
    }, [selectedViewObjects, linkedViewObjectIds])

    // Filter views by search query
    const filteredViews = useMemo(() => {
        if (!searchQuery) return allViews
        return allViews.filter(view =>
            view.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [allViews, searchQuery])

    return (
        <div className="w-full h-full overflow-y-auto bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <div className="flex flex-col divide-y divide-gray-300">
                {
                    workspaceId &&
                    <div className="flex flex-col xl:flex-row gap-2 flex-wrap p-4">
                        <button
                            onClick={() => setIsVisibilitySelecting(true)}
                            disabled={!workspaceId}
                            className="px-2 py-1 inline-flex items-center justify-center gap-2 rounded-lg "
                        >
                            {getVisibilityIcon(note.visibility)}
                            <div className="flex-1 text-left px-4">
                                {t(`common.${note.visibility}`) || note.visibility}
                            </div>
                        </button>
                        <button
                            onClick={() => setIsPinning(true)}
                            disabled={!workspaceId}
                            className="px-2 py-1 inline-flex items-center justify-center gap-2 rounded-lg "
                        >
                            <Pin size={16} />
                            <div className="flex-1 text-left px-4">
                                {t('views.pinTo') || 'Pin to...'}
                            </div>
                        </button>
                        <button onClick={handleDelete} className="px-2 py-1 text-red-500 rounded-lg inline-flex items-center justify-center gap-2 ">
                            <Trash2 size={16} />
                            <div className="flex-1 text-left px-4">
                                {t("actions.delete")}
                            </div>
                        </button>
                    </div>
                }

                <div className="flex flex-col p-4">
                    {/* View Objects Section */}
                    {groupedByView.length > 0 && (
                        <Accordion.Root
                            type="multiple"
                            defaultValue={[]}
                            className="space-y-2"
                        >
                            {groupedByView.map((viewGroup) => (
                                <Accordion.Item
                                    key={viewGroup.view.id}
                                    value={viewGroup.view.id}
                                    className="border border-gray-200 dark:border-neutral-700 rounded-lg overflow-hidden"
                                >
                                    <Accordion.Trigger className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors group">
                                        <div className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 font-medium flex-1 text-left">

                                            <Link
                                                to={workspaceId
                                                    ? `/workspaces/${workspaceId}/views/${viewGroup.view.id}`
                                                    : `/explore/views/${viewGroup.view.id}`
                                                }
                                                className=""
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {viewGroup.view.name}
                                            </Link>
                                        </div>
                                        <ChevronDown
                                            size={16}
                                            className="text-gray-400 transition-transform duration-200 group-data-[state=closed]:-rotate-90"
                                        />

                                    </Accordion.Trigger>
                                    <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                                        <div className="p-3 flex flex-col gap-2 text-gray-600 dark:text-gray-400">
                                            {viewGroup.viewObjects.map((vo: any) => (
                                                <Link
                                                    key={vo.id}
                                                    to={workspaceId
                                                        ? `/workspaces/${workspaceId}/views/${viewGroup.view.id}/objects/${vo.id}`
                                                        : `/explore/views/${viewGroup.view.id}/objects/${vo.id}`
                                                    }
                                                    className="hover:text-gray-900 dark:hover:text-gray-200 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                                                >
                                                    {vo.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </Accordion.Content>
                                </Accordion.Item>
                            ))}
                        </Accordion.Root>
                    )}
                </div>
            </div>
            {/* Visibility Selection Dialog */}
            <Dialog.Root open={isVisibilitySelecting} onOpenChange={setIsVisibilitySelecting}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[500px] z-50">
                        <Dialog.Title className="text-xl font-semibold mb-4">
                            {t('visibility.selectVisibility') || 'Select Visibility'}
                        </Dialog.Title>

                        {/* Visibility Options */}
                        <div className="space-y-3">
                            {(['private', 'workspace', 'public'] as const).map((visibility) => (
                                <button
                                    key={visibility}
                                    onClick={() => handleUpdateVisibility(visibility)}
                                    disabled={updateVisibilityMutation.isPending}
                                    className={`w-full text-left p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors ${note.visibility === visibility
                                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                        : 'dark:border-neutral-600'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5">
                                            {getVisibilityIcon(visibility)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium flex items-center gap-2">
                                                {t(`common.${visibility}`) || visibility}
                                                {note.visibility === visibility && (
                                                    <span className="text-xs text-blue-600 dark:text-blue-400">
                                                        {t('visibility.current') || '(Current)'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {t(`visibility.${visibility}`) || ''}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Dialog.Close asChild>
                                <button className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                    {t('common.close') || 'Close'}
                                </button>
                            </Dialog.Close>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Pin to View Object Dialog */}
            <Dialog.Root open={isPinning} onOpenChange={setIsPinning}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                    <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[600px] z-50 max-h-[85vh] overflow-y-auto">
                        <Dialog.Title className="text-xl font-semibold mb-4">
                            {t('views.pinNoteToObject') || 'Pin Note to View Object'}
                        </Dialog.Title>

                        {/* Search */}
                        <div className="mb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('views.searchViews') || 'Search views...'}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                />
                            </div>
                        </div>

                        {!selectedViewId ? (
                            /* Views List */
                            <div className="space-y-2">
                                {filteredViews.length > 0 ? (
                                    filteredViews.map((view) => (
                                        <button
                                            key={view.id}
                                            onClick={() => setSelectedViewId(view.id)}
                                            className="w-full text-left p-4 border dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                {view.type === 'calendar' ? (
                                                    <Calendar size={20} className="text-gray-500" />
                                                ) : (
                                                    <MapPin size={20} className="text-gray-500" />
                                                )}
                                                <span className="font-medium">{view.name}</span>
                                            </div>
                                            <ChevronRight size={20} className="text-gray-400" />
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 py-8">
                                        {searchQuery ? (t('views.noViewsFound') || 'No views found') : (t('views.noViews') || 'No views available')}
                                    </p>
                                )}
                            </div>
                        ) : (
                            /* View Objects List */
                            <div className="space-y-2">
                                <button
                                    onClick={() => setSelectedViewId(null)}
                                    className="mb-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                                >
                                    <ChevronRight size={16} className="rotate-180" />
                                    {t('common.back') || 'Back'}
                                </button>

                                {/* Create New Object Button */}
                                <button
                                    onClick={() => setIsCreatingObject(true)}
                                    className="w-full mb-4 px-4 py-3 bg-black text-white dark:bg-neutral-700 rounded-lg flex items-center justify-center gap-2 hover:bg-neutral-800 dark:hover:bg-neutral-600 transition-colors"
                                >
                                    <Plus size={18} />
                                    {selectedView?.type === 'calendar' ? (t('views.newSlot') || 'New Slot') : (t('views.newMarker') || 'New Marker')}
                                </button>

                                {availableViewObjects.length > 0 ? (
                                    availableViewObjects.map((obj) => (
                                        <button
                                            key={obj.id}
                                            onClick={() => pinNoteMutation.mutate({ viewId: selectedViewId, objectId: obj.id })}
                                            disabled={pinNoteMutation.isPending}
                                            className="w-full text-left p-4 border dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-50"
                                        >
                                            <div className="font-medium">{obj.name}</div>
                                            {obj.type === 'calendar_slot' && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {new Date(obj.data).toLocaleDateString()}
                                                </div>
                                            )}
                                            {obj.type === 'map_marker' && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {(() => {
                                                        try {
                                                            const markerData = JSON.parse(obj.data)
                                                            return `${markerData.lat.toFixed(4)}, ${markerData.lng.toFixed(4)}`
                                                        } catch {
                                                            return ''
                                                        }
                                                    })()}
                                                </div>
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 py-8">
                                        {t('views.allObjectsLinked') || 'All objects in this view are already linked to this note'}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <Dialog.Close asChild>
                                <button className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800">
                                    {t('common.close') || 'Close'}
                                </button>
                            </Dialog.Close>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            {/* Create View Object Modal */}
            {selectedView && (
                <CreateViewObjectModal
                    open={isCreatingObject}
                    onOpenChange={setIsCreatingObject}
                    viewType={selectedView.type}
                    name={newObjectName}
                    setName={setNewObjectName}
                    data={newObjectData}
                    setData={setNewObjectData}
                    onSubmit={handleCreateObject}
                    isSubmitting={createAndLinkMutation.isPending}
                />
            )}
        </div>
    )
}

export default NoteDetailSidebar