import { FC, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import { Icon } from 'leaflet'
import { MapMarkerData, ViewObject } from '@/types/view'
import { X } from 'lucide-react'

interface MiniMapViewProps {
    markers: MapMarkerData[]
    viewObjects: ViewObject[]
}

const MiniMapView: FC<MiniMapViewProps> = ({ markers, viewObjects }) => {
    const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null)
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
        <div onClick={(e) => e.preventDefault()}>
            <div className="h-48 w-full rounded-lg overflow-hidden border dark:border-neutral-700">
                <MapContainer
                    center={mapCenter}
                    zoom={zoom}
                    className="h-full w-full"
                    scrollWheelZoom={true}
                    dragging={true}
                    zoomControl={true}
                    doubleClickZoom={true}
                    touchZoom={true}
                >
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
            </div>

            {/* Selected marker info */}
            {selectedMarker && (
                <div className="mt-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded text-xs">
                    <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold">
                            {selectedMarker.viewObject?.name || 'Marker'}
                        </div>
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