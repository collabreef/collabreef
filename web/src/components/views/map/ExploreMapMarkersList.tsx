import { useTranslation } from "react-i18next"
import { MapPin, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

interface ExploreMapMarkersListProps {
    markers: any[]
    mapId: string
    focusedMarkerId?: string
}

const ExploreMapMarkersList = ({
    markers,
    mapId,
    focusedMarkerId
}: ExploreMapMarkersListProps) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")

    const handleMarkerClick = (markerId: string) => {
        navigate(`/share/map/${mapId}/marker/${markerId}`)
    }

    let parsedMarkers: any[] = []
    try {
        parsedMarkers = markers.map(marker => ({
            ...marker,
            data: typeof marker.data === 'string' ? JSON.parse(marker.data) : marker.data
        }))
    } catch (e) {
        console.error('Failed to parse markers:', e)
        parsedMarkers = markers
    }

    const filteredMarkers = parsedMarkers.filter((marker) => {
        if (!searchQuery.trim()) return true
        return marker.name.toLowerCase().includes(searchQuery.toLowerCase())
    })

    return (
        <div className="h-full overflow-y-auto bg-neutral-100 dark:bg-neutral-900">
            <div className="p-4">
                <div className="text-lg font-semibold mb-4">{t('views.mapMarkers')}</div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('views.searchMarkers')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {filteredMarkers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {searchQuery.trim() ? t('views.noMarkersFound') : t('views.noMarkers')}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredMarkers.map((marker) => {
                            const isFocused = marker.id === focusedMarkerId

                            return (
                                <div
                                    key={marker.id}
                                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                                        isFocused
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                    }`}
                                    onClick={() => handleMarkerClick(marker.id)}
                                >
                                    <div className="flex items-start gap-2">
                                        <MapPin size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{marker.name}</div>
                                            {marker.data?.lat && marker.data?.lng && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {marker.data.lat.toFixed(4)}, {marker.data.lng.toFixed(4)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ExploreMapMarkersList
