import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Calendar, MapPin, ArrowLeft, ChevronRight } from "lucide-react"
import { getPublicView, getPublicViewObjects } from "@/api/view"
import { ViewObject } from "@/types/view"
import { TwoColumn, TwoColumnMain, TwoColumnSidebar, useTwoColumn } from "@/components/twocolumn"
import CalendarViewComponent from "@/components/views/calendar/CalendarViewComponent"
import MapViewComponent from "@/components/views/map/MapViewComponent"
import PublicViewObjectNotesManager from "@/components/views/PublicViewObjectNotesManager"

const ExploreViewDetailPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { viewId } = useParams<{ viewId: string }>()
    const [selectedViewObject, setSelectedViewObject] = useState<ViewObject | null>(null)

    const { data: view, isLoading: isViewLoading } = useQuery({
        queryKey: ['publicView', viewId],
        queryFn: () => getPublicView(viewId!),
        enabled: !!viewId,
    })

    const { data: viewObjects } = useQuery({
        queryKey: ['public-view-objects', viewId],
        queryFn: () => getPublicViewObjects(viewId!),
        enabled: !!viewId,
    })

    if (isViewLoading) {
        return <div className="flex justify-center items-center h-screen">{t('common.loading')}</div>
    }

    if (!view) {
        return <div className="flex justify-center items-center h-screen">{t('views.viewNotFound')}</div>
    }

    return (
        <TwoColumn>
            <TwoColumnMain className="bg-white dark:bg-neutral-800">
                <PublicViewContent
                    view={view}
                    viewObjects={viewObjects}
                    navigate={navigate}
                />
            </TwoColumnMain>

            <TwoColumnSidebar className="bg-white">
                <ViewObjectsSidebar
                    view={view}
                    viewObjects={viewObjects}
                    selectedViewObject={selectedViewObject}
                    setSelectedViewObject={setSelectedViewObject}
                />
            </TwoColumnSidebar>
        </TwoColumn>
    )
}

// Sidebar component - displays view objects list (read-only for public views)
const ViewObjectsSidebar = ({ view, viewObjects, selectedViewObject, setSelectedViewObject }: any) => {
    const { t } = useTranslation()
    const { toggleSidebar } = useTwoColumn()

    const getIcon = () => {
        if (view.type === 'calendar') return <Calendar size={18} />
        if (view.type === 'map') return <MapPin size={18} />
        return <Calendar size={18} />
    }

    const getTitle = () => {
        if (view.type === 'calendar') return t('views.calendarSlots')
        if (view.type === 'map') return t('views.mapMarkers')
        return 'Objects'
    }

    const getEmptyMessage = () => {
        if (view.type === 'calendar') return t('views.noSlots')
        if (view.type === 'map') return t('views.noMarkers')
        return 'No objects yet'
    }

    return (
        <div className="w-full sm:w-96">
            <div className="sticky top-0 bg-gray-50 dark:bg-neutral-900 border-b dark:border-neutral-700 px-4 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    {getIcon()}
                    <div className="text-lg font-semibold">{getTitle()}</div>
                </div>
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
                    title={t('views.hideSidebar')}
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            <div className="p-4 space-y-4 overflow-x-hidden min-h-screen bg-gray-50 dark:bg-neutral-900">
                {viewObjects && viewObjects.length > 0 ? (
                    viewObjects.map((obj: ViewObject) => (
                        <div
                            key={obj.id}
                            className={`bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-700 p-4 cursor-pointer transition-all ${
                                selectedViewObject?.id === obj.id ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => setSelectedViewObject(obj)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 truncate text-ellipsis">
                                    <div className="font-semibold mb-2">{obj.name}</div>
                                    {obj.data && (
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {(() => {
                                                // For map markers, parse and display coordinates
                                                if (obj.type === 'map_marker') {
                                                    try {
                                                        const coords = JSON.parse(obj.data)
                                                        if (coords.lat && coords.lng) {
                                                            return (
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-1">
                                                                        <MapPin size={12} className="flex-shrink-0" />
                                                                        <span className="text-xs">
                                                                            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        }
                                                    } catch (e) {
                                                        // If parsing fails, show raw data
                                                        return <p className="whitespace-pre-wrap">{obj.data}</p>
                                                    }
                                                }
                                                // For calendar slots, show the date
                                                if (obj.type === 'calendar_slot') {
                                                    return (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={12} className="flex-shrink-0" />
                                                            <span className="text-xs">{obj.data}</span>
                                                        </div>
                                                    )
                                                }
                                                // Default: show raw data
                                                return <p className="whitespace-pre-wrap">{obj.data}</p>
                                            })()}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2">
                                        {t('views.createdBy')}: {obj.created_by}
                                    </p>
                                </div>
                            </div>

                            {/* Public View Object Notes Manager */}
                            {selectedViewObject?.id === obj.id && (
                                <PublicViewObjectNotesManager
                                    viewId={view.id}
                                    viewObjectId={obj.id}
                                />
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        {getIcon()}
                        <p className="text-sm mt-4">{getEmptyMessage()}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// Main content component - renders different views based on type (read-only for public)
const PublicViewContent = ({ view, viewObjects, navigate }: any) => {
    const { t } = useTranslation()
    const { isSidebarCollapsed, toggleSidebar } = useTwoColumn()

    if (view.type === 'calendar') {
        return (
            <div className="px-4 w-full">
                <div className="py-4">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/explore/views')}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-semibold">{view.name}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={toggleSidebar}
                                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
                            >
                                <Calendar size={18} />
                            </button>
                        </div>
                    </div>

                    <CalendarViewComponent viewObjects={viewObjects} />
                </div>
            </div>
        )
    }

    if (view.type === 'map') {
        return (
            <div className="w-full h-full flex flex-col">
                {/* Header */}
                <div className="flex-shrink-0 px-4 py-4 border-b dark:border-neutral-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/explore/views')}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl font-semibold">{view.name}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={toggleSidebar}
                                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
                            >
                                <MapPin size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Map - takes remaining space */}
                <div className="flex-1 overflow-hidden">
                    <MapViewComponent viewObjects={viewObjects} view={view} />
                </div>
            </div>
        )
    }

    return null
}

export default ExploreViewDetailPage