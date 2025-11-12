import { useState, useMemo } from "react"
import { useNavigate, useOutletContext } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Calendar, MapPin, ChevronRight, Search } from "lucide-react"
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
    const [searchQuery, setSearchQuery] = useState("")
    const [isInputFocused, setIsInputFocused] = useState(false)

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

    // Filter view objects based on search query (name only)
    const filteredViewObjects = useMemo(() => {
        if (!viewObjects || !searchQuery.trim()) return viewObjects

        const query = searchQuery.toLowerCase().trim()
        return viewObjects.filter((obj: ViewObject) => {
            // Search in name only
            return obj.name?.toLowerCase().includes(query)
        })
    }, [viewObjects, searchQuery])

    return (
        <div className="w-full sm:w-96">
            <div className="p-4 flex flex-col gap-4 overflow-x-hidden bg-neutral-100 dark:bg-neutral-900 min-h-screen">
                <div
                    className="flex items-center gap-2 p-2 rounded-lg bg-neutral-200 dark:bg-neutral-800"
                    onClick={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                >
                    <span>
                        <Search size={16} />
                    </span>
                    <input
                        className="bg-inherit outline-none flex-1"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        type="text"
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        onTouchEnd={(e) => e.stopPropagation()}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => {
                            // Delay blur to prevent backdrop click during keyboard close
                            setTimeout(() => setIsInputFocused(false), 300)
                        }}
                    />
                </div>
                <div className="space-y-4">
                    {filteredViewObjects && filteredViewObjects.length > 0 ? (
                        filteredViewObjects.map((obj: ViewObject) => (
                            <div
                                key={obj.id}
                            className="bg-white dark:bg-neutral-800 rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500 dark:hover:border-blue-500"
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
                            <p className="text-sm mt-4">
                                {searchQuery.trim() ? t('common.noResults') : getEmptyMessage()}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ExploreViewObjectsList
