import { useNavigate, useOutletContext } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Calendar, MapPin, ChevronRight } from "lucide-react"
import { ViewObject } from "@/types/view"
import { useTwoColumn } from "@/components/twocolumn"

interface ExploreViewObjectsListContext {
    view: any
    viewObjects: ViewObject[]
    viewId: string
}

const ExploreViewObjectsList = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { toggleSidebar } = useTwoColumn()
    const { view, viewObjects, viewId } = useOutletContext<ExploreViewObjectsListContext>()

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
                            className="bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-700 p-4 cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all"
                            onClick={() => navigate(`/explore/views/${viewId}/objects/${obj.id}`)}
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

export default ExploreViewObjectsList
