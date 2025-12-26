import { useTranslation } from "react-i18next"
import { MapPin, Trash2, MoreVertical, Plus, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"

interface MapMarkersListProps {
    markers: any[]
    workspaceId: string
    mapId: string
    focusedMarkerId?: string
    onDelete: (markerId: string) => void
    isDeleting?: boolean
    onCreateClick?: () => void
}

const MapMarkersList = ({
    markers,
    workspaceId,
    mapId,
    focusedMarkerId,
    onDelete,
    isDeleting,
    onCreateClick
}: MapMarkersListProps) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")

    const handleMarkerClick = (markerId: string) => {
        navigate(`/workspaces/${workspaceId}/map/${mapId}/marker/${markerId}`)
    }

    const filteredMarkers = markers.filter((marker) => {
        if (!searchQuery.trim()) return true
        return marker.name.toLowerCase().includes(searchQuery.toLowerCase())
    })

    const sortedMarkers = [...filteredMarkers].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return (
        <div className="h-full overflow-y-auto bg-neutral-100 dark:bg-neutral-900">
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">{t('views.mapMarkers')}</h2>
                    {onCreateClick && (
                        <button
                            onClick={onCreateClick}
                            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title={t('views.createMarker')}
                        >
                            <Plus size={20} />
                        </button>
                    )}
                </div>

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

                {sortedMarkers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {searchQuery.trim() ? t('views.noMarkersFound') : t('views.noMarkers')}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sortedMarkers.map((marker) => {
                            let markerData: any = {}
                            try {
                                markerData = JSON.parse(marker.data)
                            } catch (e) {
                                console.error('Failed to parse marker data:', e)
                            }

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
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                            <MapPin size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{marker.name}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {markerData.lat?.toFixed(4)}, {markerData.lng?.toFixed(4)}
                                                </div>
                                            </div>
                                        </div>
                                        <DropdownMenu.Root>
                                            <DropdownMenu.Trigger asChild>
                                                <button
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                            </DropdownMenu.Trigger>
                                            <DropdownMenu.Portal>
                                                <DropdownMenu.Content
                                                    className="min-w-[160px] bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 p-1 z-50"
                                                    sideOffset={5}
                                                >
                                                    <DropdownMenu.Item
                                                        className="flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer outline-none text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        onSelect={(e) => {
                                                            e.preventDefault()
                                                            onDelete(marker.id)
                                                        }}
                                                        disabled={isDeleting}
                                                    >
                                                        <Trash2 size={14} />
                                                        {t('actions.delete')}
                                                    </DropdownMenu.Item>
                                                </DropdownMenu.Content>
                                            </DropdownMenu.Portal>
                                        </DropdownMenu.Root>
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

export default MapMarkersList
