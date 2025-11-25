import { FC, useMemo, useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { Icon } from 'leaflet'
import { MapMarkerData, ViewObject } from '@/types/view'
import { X } from 'lucide-react'
import { Link } from 'react-router-dom'

interface MiniMapViewProps {
    markers: MapMarkerData[]
    viewObjects: ViewObject[]
    viewId: string
    workspaceId?: string
}

// Component to force map to recalculate size
const MapResizer: FC = () => {
    const map = useMap()

    useEffect(() => {
        // Aggressive size recalculation on mount
        const recalculate = () => {
            map.invalidateSize(true)
        }

        // Call immediately
        recalculate()

        // Then call multiple times with delays
        const timer1 = setTimeout(recalculate, 100)
        const timer2 = setTimeout(recalculate, 300)
        const timer3 = setTimeout(recalculate, 500)
        const timer4 = setTimeout(recalculate, 1000)

        // Also recalculate on any move/zoom
        map.on('moveend', recalculate)
        map.on('zoomend', recalculate)

        return () => {
            clearTimeout(timer1)
            clearTimeout(timer2)
            clearTimeout(timer3)
            clearTimeout(timer4)
            map.off('moveend', recalculate)
            map.off('zoomend', recalculate)
        }
    }, [map])

    return null
}

const MiniMapView: FC<MiniMapViewProps> = ({ markers, viewObjects, viewId, workspaceId }) => {
    const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null)
    const [isReady, setIsReady] = useState(false)

    // Delay map rendering to ensure container is fully sized
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsReady(true)
        }, 1)
        return () => clearTimeout(timer)
    }, [])

    // Use the first marker as center point
    const mapCenter: [number, number] = useMemo(() => {
        if (markers.length === 0) {
            return [25.0330, 121.5654] // Default center
        }

        // Always use the first marker as center
        return [markers[0].lat, markers[0].lng]
    }, [markers])

    // Calculate zoom level based on markers spread
    const zoom = useMemo(() => {
        if (markers.length <= 1) return 13

        // Calculate rough bounds to determine appropriate zoom
        const lats = markers.map(m => m.lat)
        const lngs = markers.map(m => m.lng)
        const latSpread = Math.max(...lats) - Math.min(...lats)
        const lngSpread = Math.max(...lngs) - Math.min(...lngs)
        const maxSpread = Math.max(latSpread, lngSpread)

        if (maxSpread > 1) return 8
        if (maxSpread > 0.5) return 10
        if (maxSpread > 0.1) return 12
        return 13
    }, [markers])

    const markerIcon = useMemo(() => {
        return new Icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        })
    }, [])

    const handleMarkerClick = (index: number) => {
        setSelectedMarkerIndex(index)
    }

    const selectedMarker = selectedMarkerIndex !== null ? {
        marker: markers[selectedMarkerIndex],
        viewObject: viewObjects[selectedMarkerIndex]
    } : null

    return (
        <div className="h-full flex flex-col" onClick={(e) => e.preventDefault()}>
            <div
                className="flex-1 min-h-0 w-full rounded-lg overflow-hidden border dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"
                style={{ transform: 'translateZ(0)' }}
            >
                {isReady ? (
                    <MapContainer
                        center={mapCenter}
                        zoom={zoom}
                        className="h-full w-full"
                        scrollWheelZoom={true}
                        dragging={true}
                        zoomControl={true}
                        doubleClickZoom={true}
                        touchZoom={true}
                        preferCanvas={true}
                    >
                        <MapResizer />
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {markers.map((marker, index) => (
                            <Marker
                                key={index}
                                position={[marker.lat, marker.lng]}
                                icon={markerIcon}
                                eventHandlers={{
                                    click: () => handleMarkerClick(index)
                                }}
                            />
                        ))}
                    </MapContainer>
                ) : (
                    <div className="h-full w-full flex items-center justify-center text-neutral-500">
                        Loading map...
                    </div>
                )}
            </div>

            {/* Selected marker info */}
            {selectedMarker && (
                <div className="mt-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded text-xs">
                    <div className="flex items-center justify-between mb-1">
                        <Link
                            to={workspaceId
                                ? `/workspaces/${workspaceId}/views/${viewId}/objects/${selectedMarker.viewObject?.id}`
                                : `/explore/views/${viewId}/objects/${selectedMarker.viewObject?.id}`
                            }
                            className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {selectedMarker.viewObject?.name || 'Marker'}
                        </Link>
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                setSelectedMarkerIndex(null)
                            }}
                            className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                        >
                            <X size={12} />
                        </button>
                    </div>
                    <div className="text-gray-600 dark:text-gray-400 space-y-0.5">
                        <div>Lat: {selectedMarker.marker.lat.toFixed(6)}</div>
                        <div>Lng: {selectedMarker.marker.lng.toFixed(6)}</div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MiniMapView