import { FC, useMemo, useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { NoteData } from "@/api/note"
import { getViewObjectsForNote, getPublicViewObjectsForNote, getViews, getViewObjects, addNoteToViewObject, createViewObject } from "@/api/view"
import { useTranslation } from "react-i18next"
import { ChevronRight, Calendar, MapPin, Search, Plus, X, Calendar1Icon, LayoutGrid } from "lucide-react"
import { ViewObjectType } from "@/types/view"
import { Link, useParams } from "react-router-dom"
import { useToastStore } from "@/stores/toast"
import CreateViewObjectModal from "@/components/views/CreateViewObjectModal"
import { BottomSheet } from "@/components/bottomsheet/BottomSheet"

interface PinToViewObjectModalProps {
    note: NoteData
    isOpen: boolean
    onClose: () => void
}

const PinToViewObjectModal: FC<PinToViewObjectModalProps> = ({ note, isOpen, onClose }) => {
    const { t } = useTranslation()
    const { workspaceId } = useParams<{ workspaceId?: string }>()
    const { addToast } = useToastStore()
    const queryClient = useQueryClient()
    const [isPinning, setIsPinning] = useState(false)
    const [selectedViewId, setSelectedViewId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreatingObject, setIsCreatingObject] = useState(false)
    const [newObjectName, setNewObjectName] = useState("")
    const [newObjectData, setNewObjectData] = useState("")
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 640)

    // Update isDesktop on resize
    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 640)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setIsPinning(false)
            setSelectedViewId(null)
            setSearchQuery("")
            setIsCreatingObject(false)
            setNewObjectName("")
            setNewObjectData("")
        }
    }, [isOpen])

    // Use public endpoint when viewing from explore page (no workspaceId in URL)
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
        enabled: !!note.id && isOpen,
    })

    // Fetch all views when pin dialog is open
    const { data: allViews = [] } = useQuery({
        queryKey: ['views', workspaceId],
        queryFn: () => workspaceId ? getViews(workspaceId, 1, 100) : Promise.resolve([]),
        enabled: isPinning && !!workspaceId && isOpen
    })

    // Fetch view objects for selected view
    const { data: selectedViewObjects = [] } = useQuery({
        queryKey: ['view-objects', workspaceId, selectedViewId],
        queryFn: () => workspaceId && selectedViewId ? getViewObjects(workspaceId, selectedViewId, 1, 100) : Promise.resolve([]),
        enabled: !!selectedViewId && !!workspaceId && isOpen
    })

    // Add note to view object mutation
    const pinNoteMutation = useMutation({
        mutationFn: ({ viewId, objectId }: { viewId: string, objectId: string }) => {
            if (!workspaceId || !note.id) throw new Error('Missing required parameters')
            return addNoteToViewObject(workspaceId, viewId, objectId, note.id)
        },
        onSuccess: () => {
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
        if (selectedView?.type === 'kanban') return 'kanban_column'
        return 'calendar_slot'
    }

    // Create view object and link to note mutation
    const createAndLinkMutation = useMutation({
        mutationFn: async (data: { name: string; data: string }) => {
            if (!workspaceId || !selectedViewId || !note.id) throw new Error('Missing required parameters')
            const newObject = await createViewObject(workspaceId, selectedViewId, {
                name: data.name,
                type: getObjectType(),
                data: data.data
            })
            await addNoteToViewObject(workspaceId, selectedViewId, newObject.id, note.id)
            return newObject
        },
        onSuccess: () => {
            refetchViewObjects()
            queryClient.invalidateQueries({ queryKey: ['note-view-objects', workspaceId, note.id] })
            queryClient.invalidateQueries({ queryKey: ['view-objects', workspaceId, selectedViewId] })
            setIsCreatingObject(false)
            setNewObjectName("")
            setNewObjectData("")
            setIsPinning(false)
            setSelectedViewId(null)
            setSearchQuery("")
            addToast({ title: t('views.objectCreated'), type: 'success' })
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

    const content = (
        <div className="flex flex-col h-full">
            {!isPinning ? (
                // Show pinned items
                <div className="flex flex-col p-4">
                    {groupedByView.length > 0 && (
                        <div className="font-bold text-gray-400 p-2 mb-2">
                            {t("common.pinned")}
                        </div>
                    )}
                    {groupedByView.length > 0 ? (
                        groupedByView.map((viewGroup) => (
                            <div key={viewGroup.view.id}>
                                {viewGroup.viewObjects.map((vo: any) => {
                                    const getObjectUrl = () => {
                                        const viewType = viewGroup.view.type
                                        const viewId = viewGroup.view.id
                                        const objectId = vo.id

                                        if (workspaceId) {
                                            if (viewType === 'calendar') {
                                                return `/workspaces/${workspaceId}/calendar/${viewId}/slot/${objectId}`
                                            } else if (viewType === 'map') {
                                                return `/workspaces/${workspaceId}/map/${viewId}/marker/${objectId}`
                                            } else if (viewType === 'kanban') {
                                                return `/workspaces/${workspaceId}/kanban/${viewId}`
                                            }
                                        } else {
                                            if (viewType === 'calendar') {
                                                return `/share/calendar/${viewId}/slot/${objectId}`
                                            } else if (viewType === 'map') {
                                                return `/share/map/${viewId}/marker/${objectId}`
                                            } else if (viewType === 'kanban') {
                                                return `/share/kanban/${viewId}`
                                            }
                                        }
                                        return '#'
                                    }

                                    return (
                                        <Link key={vo.id} to={getObjectUrl()}>
                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 px-2 py-1 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded">
                                                <div>
                                                    {vo.type === "map_marker" ? (
                                                        <MapPin size={16} />
                                                    ) : vo.type === "kanban_column" ? (
                                                        <LayoutGrid size={16} />
                                                    ) : (
                                                        <Calendar1Icon size={16} />
                                                    )}
                                                </div>
                                                <div className="flex-1 px-2">{vo.name}</div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            {t('views.noPinnedViews')}
                        </div>
                    )}

                    {workspaceId && (
                        <button
                            onClick={() => setIsPinning(true)}
                            className="mt-4 px-4 py-2 bg-black text-white dark:bg-neutral-700 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-600 transition-colors"
                        >
                            {t('views.pinToNewView')}
                        </button>
                    )}
                </div>
            ) : (
                // Pin interface
                <div className="flex flex-col p-4 h-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-lg font-semibold">
                            {t('views.pinNoteToObject')}
                        </div>
                        <button
                            onClick={() => {
                                setIsPinning(false)
                                setSelectedViewId(null)
                                setSearchQuery("")
                            }}
                            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('views.searchViews')}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {!selectedViewId ? (
                            <div className="space-y-2">
                                {filteredViews.length > 0 ? (
                                    filteredViews.map((view) => (
                                        <button
                                            key={view.id}
                                            onClick={() => setSelectedViewId(view.id)}
                                            className="w-full text-left p-3 border dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                {view.type === 'calendar' ? (
                                                    <Calendar size={18} className="text-gray-500" />
                                                ) : view.type === 'kanban' ? (
                                                    <LayoutGrid size={18} className="text-gray-500" />
                                                ) : (
                                                    <MapPin size={18} className="text-gray-500" />
                                                )}
                                                <span className="font-medium">{view.name}</span>
                                            </div>
                                            <ChevronRight size={18} className="text-gray-400" />
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 py-8">
                                        {searchQuery ? t('views.noViewsFound') : t('views.noViews')}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <button
                                    onClick={() => setSelectedViewId(null)}
                                    className="mb-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
                                >
                                    <ChevronRight size={16} className="rotate-180" />
                                    {t('common.back')}
                                </button>

                                <button
                                    onClick={() => setIsCreatingObject(true)}
                                    className="w-full mb-4 px-4 py-3 bg-black text-white dark:bg-neutral-700 rounded-lg flex items-center justify-center gap-2 hover:bg-neutral-800 dark:hover:bg-neutral-600 transition-colors"
                                >
                                    <Plus size={18} />
                                    {selectedView?.type === 'calendar'
                                        ? t('views.newSlot')
                                        : selectedView?.type === 'kanban'
                                            ? t('views.newColumn')
                                            : t('views.newMarker')}
                                </button>

                                {availableViewObjects.length > 0 ? (
                                    availableViewObjects.map((obj) => (
                                        <button
                                            key={obj.id}
                                            onClick={() => pinNoteMutation.mutate({ viewId: selectedViewId, objectId: obj.id })}
                                            disabled={pinNoteMutation.isPending}
                                            className="w-full text-left p-3 border dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 disabled:opacity-50"
                                        >
                                            <div className="flex items-center gap-2">
                                                {obj.type === 'kanban_column' && (() => {
                                                    try {
                                                        const columnData = JSON.parse(obj.data)
                                                        if (columnData.color) {
                                                            return (
                                                                <div
                                                                    className="w-3 h-3 rounded"
                                                                    style={{ backgroundColor: columnData.color }}
                                                                ></div>
                                                            )
                                                        }
                                                    } catch {
                                                        return null
                                                    }
                                                    return null
                                                })()}
                                                <div className="font-medium">{obj.name}</div>
                                            </div>
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
                                            {obj.type === 'kanban_column' && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {t('views.column')}
                                                </div>
                                            )}
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500 py-8 text-sm">
                                        {t('views.allObjectsLinked')}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

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

    // Desktop: Modal
    if (isDesktop) {
        return (
            <>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/50 z-50"
                            onClick={onClose}
                        />
                        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[80vh] bg-white dark:bg-neutral-900 rounded-lg shadow-xl z-50 overflow-hidden">
                            {content}
                        </div>
                    </>
                )}
            </>
        )
    }

    // Mobile: Bottom Sheet
    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} breakpoint={640}>
            {content}
        </BottomSheet>
    )
}

export default PinToViewObjectModal
