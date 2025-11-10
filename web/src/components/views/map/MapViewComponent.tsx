import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet'
import { Icon } from 'leaflet'
import { ViewObject, View, MapViewData } from '@/types/view'
import { useNavigate, useParams } from 'react-router-dom'

interface MapViewComponentProps {
    viewObjects?: ViewObject[]
    view?: View
    focusedObjectId?: string
    isPublic?: boolean
}

interface MapMarkerData {
    lat: number
    lng: number
}

const MapViewComponent = ({ viewObjects = [], view, focusedObjectId, isPublic = false }: MapViewComponentProps) => {
    const navigate = useNavigate()
    const { workspaceId, viewId } = useParams<{ workspaceId?: string; viewId: string }>()

    // Parse view data to get default settings
    const viewSettings = useMemo(() => {
        if (!view?.data) return null
        try {
            return JSON.parse(view.data) as MapViewData
        } catch (e) {
            console.error('Failed to parse view data:', e)
            return null
        }
    }, [view?.data])

    // Parse viewObjects to extract valid map markers
    const markers = useMemo(() => {
        return viewObjects
            .filter(obj => obj.type === 'map_marker')
            .map(obj => {
                // Skip if data is empty or invalid
                if (!obj.data || typeof obj.data !== 'string') {
                    console.warn('Marker has invalid data:', obj)
                    return null
                }

                try {
                    const data: MapMarkerData = JSON.parse(obj.data)
                    if (data.lat && data.lng && !isNaN(data.lat) && !isNaN(data.lng)) {
                        return {
                            id: obj.id,
                            name: obj.name,
                            lat: data.lat,
                            lng: data.lng
                        }
                    } else {
                        console.warn('Marker data missing lat/lng:', obj.data)
                    }
                } catch (e) {
                    console.error('Failed to parse marker data:', obj.data, 'Error:', e)
                }
                return null
            })
            .filter((marker): marker is NonNullable<typeof marker> => marker !== null)
    }, [viewObjects])

    // Calculate map center based on focused object, view settings, or markers
    const mapCenter: [number, number] = useMemo(() => {
        // If there's a focused object, center on it
        if (focusedObjectId) {
            const focusedMarker = markers.find(m => m.id === focusedObjectId)
            if (focusedMarker) {
                return [focusedMarker.lat, focusedMarker.lng]
            }
        }

        // Use view settings center if available
        if (viewSettings?.center) {
            return [viewSettings.center.lat, viewSettings.center.lng]
        }

        // Otherwise use default or calculate from markers
        if (markers.length === 0) {
            return [25.0330, 121.5654]
        }

        const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length
        const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length
        return [avgLat, avgLng]
    }, [markers, viewSettings, focusedObjectId])

    // Get zoom level from view settings or use default
    const mapZoom = useMemo(() => {
        if (viewSettings?.zoom !== undefined) {
            return viewSettings.zoom
        }
        return markers.length === 0 ? 10 : 12
    }, [markers.length, viewSettings])

    // Custom marker icon
    const markerIcon = new Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    })

    return (
        <div className="h-full w-full flex flex-col">

            {/* Map container - fills remaining space */}
            <div className="flex-1 w-full relative">
                <MapContainer
                    key={`${mapCenter[0]}-${mapCenter[1]}-${focusedObjectId || 'default'}`}
                    center={mapCenter}
                    zoom={mapZoom}
                    className="h-full w-full"
                    scrollWheelZoom={true}
                    zoomControl={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {markers.map(marker => (
                        <Marker
                            key={marker.id}
                            position={[marker.lat, marker.lng]}
                            icon={markerIcon}
                        >
                            <Tooltip
                                permanent
                                direction="top"
                                offset={[0, -35]}
                                className="marker-label"
                            >
                                <div className="text-sm font-medium">{marker.name}</div>
                            </Tooltip>
                            <Popup>
                                <div className="p-2">
                                    <div className="font-semibold mb-1">{marker.name}</div>
                                    <p className="text-xs text-gray-600 mb-2">
                                        Lat: {marker.lat.toFixed(4)}<br />
                                        Lng: {marker.lng.toFixed(4)}
                                    </p>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            const path = isPublic
                                                ? `/explore/views/${viewId}/objects/${marker.id}`
                                                : `/workspaces/${workspaceId}/views/${viewId}/objects/${marker.id}`
                                            console.log('Navigating to:', path)
                                            navigate(path)
                                        }}
                                        type="button"
                                        className="text-xs px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 w-full cursor-pointer"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    )
}

export default MapViewComponent