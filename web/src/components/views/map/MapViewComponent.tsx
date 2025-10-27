import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import { ViewObject, View, MapViewData } from '@/types/view'

interface MapViewComponentProps {
    viewObjects?: ViewObject[]
    view?: View
}

interface MapMarkerData {
    lat: number
    lng: number
}

const MapViewComponent = ({ viewObjects = [], view }: MapViewComponentProps) => {
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
                try {
                    const data: MapMarkerData = JSON.parse(obj.data)
                    if (data.lat && data.lng && !isNaN(data.lat) && !isNaN(data.lng)) {
                        return {
                            id: obj.id,
                            name: obj.name,
                            lat: data.lat,
                            lng: data.lng
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse marker data:', obj.data)
                }
                return null
            })
            .filter((marker): marker is NonNullable<typeof marker> => marker !== null)
    }, [viewObjects])

    // Calculate map center based on view settings or markers
    const mapCenter: [number, number] = useMemo(() => {
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
    }, [markers, viewSettings])

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
            <div className="flex-1 w-full relative z-0">
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    className="h-full w-full z-0"
                    scrollWheelZoom={true}
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
                            <Popup>
                                <div className="p-2">
                                    <h4 className="font-semibold mb-1">{marker.name}</h4>
                                    <p className="text-xs text-gray-600">
                                        Lat: {marker.lat.toFixed(4)}<br />
                                        Lng: {marker.lng.toFixed(4)}
                                    </p>
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