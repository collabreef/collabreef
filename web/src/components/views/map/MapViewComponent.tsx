import { useMemo, useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet'
import { DivIcon } from 'leaflet'
import { ViewObject, View, MapViewData } from '@/types/view'
import { useNavigate, useParams } from 'react-router-dom'
import { useTwoColumn } from '@/components/twocolumn/TwoColumn'
import { getNotesForViewObject, getPublicNotesForViewObject } from '@/api/view'
import { NoteData } from '@/api/note'

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

interface MarkerWithNotes {
    id: string
    name: string
    lat: number
    lng: number
    firstImageUrl?: string
    noteCount: number
}

// Helper function to extract first image URL from note content
const extractFirstImageFromNote = (note: NoteData): string | null => {
    try {
        const content = JSON.parse(note.content)

        const findImageNode = (node: any): string | null => {
            if (!node) return null

            // Check if this node is an image
            if (node.type === 'image' && node.attrs?.src) {
                return node.attrs.src
            }

            // Recursively search in content
            if (node.content && Array.isArray(node.content)) {
                for (const child of node.content) {
                    const imageUrl = findImageNode(child)
                    if (imageUrl) return imageUrl
                }
            }

            return null
        }

        return findImageNode(content)
    } catch (e) {
        console.error('Failed to parse note content:', e)
        return null
    }
}

const MapViewComponent = ({ viewObjects = [], view, focusedObjectId, isPublic = false }: MapViewComponentProps) => {
    const navigate = useNavigate()
    const { workspaceId, mapId } = useParams<{ workspaceId?: string; mapId: string }>()
    const { openBottomSheet } = useTwoColumn()
    const [markersWithNotes, setMarkersWithNotes] = useState<Map<string, MarkerWithNotes>>(new Map())

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

    // Load notes for each marker
    useEffect(() => {
        const loadNotesForMarkers = async () => {
            const newMarkersWithNotes = new Map<string, MarkerWithNotes>()

            for (const marker of markers) {
                try {
                    // Fetch notes for this marker
                    let notes: NoteData[] = []
                    if (isPublic && mapId) {
                        notes = await getPublicNotesForViewObject(mapId, marker.id)
                    } else if (workspaceId && mapId) {
                        notes = await getNotesForViewObject(workspaceId, mapId, marker.id)
                    }

                    // Extract first image from notes
                    let firstImageUrl: string | undefined = undefined
                    for (const note of notes) {
                        const imageUrl = extractFirstImageFromNote(note)
                        if (imageUrl) {
                            firstImageUrl = imageUrl
                            break
                        }
                    }

                    newMarkersWithNotes.set(marker.id, {
                        ...marker,
                        firstImageUrl,
                        noteCount: notes.length
                    })
                } catch (error) {
                    console.error('Failed to load notes for marker:', marker.id, error)
                    // Still add marker but without notes info
                    newMarkersWithNotes.set(marker.id, {
                        ...marker,
                        noteCount: 0
                    })
                }
            }

            setMarkersWithNotes(newMarkersWithNotes)
        }

        if (markers.length > 0 && (workspaceId || isPublic)) {
            loadNotesForMarkers()
        }
    }, [markers, workspaceId, mapId, isPublic])

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
        // When viewing a specific marker detail, zoom to maximum
        if (focusedObjectId) {
            return 18
        }

        if (viewSettings?.zoom !== undefined) {
            return viewSettings.zoom
        }
        return markers.length === 0 ? 10 : 12
    }, [markers.length, viewSettings, focusedObjectId])

    // Create custom marker icon based on marker data
    const createMarkerIcon = (markerData: MarkerWithNotes) => {
        const { firstImageUrl, noteCount } = markerData

        if (firstImageUrl) {
            // Use image as marker
            const html = `
                <div style="
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 1px solid white;
                    background: white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">
                    <img
                        src="${firstImageUrl}"
                        style="
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                        "
                        alt="marker"
                    />
                </div>
            `
            return new DivIcon({
                html,
                className: 'custom-marker-icon',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                popupAnchor: [0, -20]
            })
        } else {
            // Use note count as marker
            const html = `
                <div style="
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: white;
                    border: 1px solid #aaa;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 12px;
                ">
                    ${noteCount}
                </div>
            `
            return new DivIcon({
                html,
                className: 'custom-marker-icon',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                popupAnchor: [0, -20]
            })
        }
    }

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

                    {markers.map(marker => {
                        const markerData = markersWithNotes.get(marker.id)
                        const icon = markerData ? createMarkerIcon(markerData) : new DivIcon({
                            html: "<div></div>",
                            className: 'custom-marker-icon',
                            iconSize: [40, 40],
                            iconAnchor: [20, 20],
                            popupAnchor: [0, -20]
                        })

                        return (
                            <Marker
                                key={marker.id}
                                position={[marker.lat, marker.lng]}
                                icon={icon}
                                eventHandlers={{
                                    click: () => {
                                        openBottomSheet()
                                        const path = isPublic
                                            ? `/explore/map/${mapId}/marker/${marker.id}`
                                            : `/workspaces/${workspaceId}/map/${mapId}/marker/${marker.id}`
                                        navigate(path)
                                    }
                                }}
                            >
                                <Tooltip
                                    permanent
                                    direction="top"
                                    offset={[0, -15]}
                                    className="marker-label"
                                >
                                    <div className="text-sm font-medium">{marker.name}</div>
                                </Tooltip>
                            </Marker>
                        )
                    })}
                </MapContainer>
            </div>
        </div >
    )
}

export default MapViewComponent