import { Dialog } from "radix-ui"
import { useTranslation } from "react-i18next"
import { ViewType } from "@/types/view"
import { useState, useEffect } from "react"
import { Search, MapPin, Navigation, Locate } from "lucide-react"
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { Icon } from 'leaflet'

interface CreateViewObjectModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    viewType: ViewType
    name: string
    setName: (name: string) => void
    data: string
    setData: (data: string) => void
    onSubmit: () => void
    isSubmitting: boolean
    inline?: boolean // New prop for inline mode
}

interface NominatimResult {
    lat: string
    lon: string
    display_name: string
}

// Map click handler component
interface MapClickHandlerProps {
    onLocationSelect: (lat: number, lng: number) => void
}

const MapClickHandler = ({ onLocationSelect }: MapClickHandlerProps) => {
    useMapEvents({
        click: (e) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

const CreateViewObjectModal = ({
    open,
    onOpenChange,
    viewType,
    name,
    setName,
    data,
    setData,
    onSubmit,
    isSubmitting,
    inline = false
}: CreateViewObjectModalProps) => {
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<NominatimResult[]>([])
    const [latitude, setLatitude] = useState("")
    const [longitude, setLongitude] = useState("")
    const [reverseGeocodedAddress, setReverseGeocodedAddress] = useState("")
    const [isReverseGeocoding, setIsReverseGeocoding] = useState(false)
    const [isGettingLocation, setIsGettingLocation] = useState(false)

    // Kanban-specific state (for creating columns)
    const [columnColor, setColumnColor] = useState('')
    const [columnOrder, setColumnOrder] = useState('')

    // Flow-specific state (for creating nodes)
    const [nodeColor, setNodeColor] = useState('')
    const [nodeX, setNodeX] = useState('')
    const [nodeY, setNodeY] = useState('')

    // Calendar-specific state (for creating slots)
    const [calendarDate, setCalendarDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [isAllDay, setIsAllDay] = useState(true)
    const [slotColor, setSlotColor] = useState('')

    // Parse existing data when modal opens for map type
    useEffect(() => {
        if (viewType === 'map' && data) {
            try {
                const coords = JSON.parse(data)
                if (coords.lat) setLatitude(coords.lat.toString())
                if (coords.lng) setLongitude(coords.lng.toString())
            } catch (e) {
                // Ignore parse errors
            }
        }
    }, [viewType, data])

    // Parse existing data when modal opens for calendar type
    useEffect(() => {
        if (viewType === 'calendar' && data) {
            try {
                const slotData = JSON.parse(data)
                if (slotData.date) setCalendarDate(slotData.date)
                if (slotData.end_date) setEndDate(slotData.end_date)
                if (slotData.start_time) setStartTime(slotData.start_time)
                if (slotData.end_time) setEndTime(slotData.end_time)
                if (slotData.is_all_day !== undefined) setIsAllDay(slotData.is_all_day)
                if (slotData.color) setSlotColor(slotData.color)
            } catch (e) {
                // Fallback for old format (just a date string)
                setCalendarDate(data)
                setIsAllDay(true)
            }
        }
    }, [viewType, data])

    // Reset search state when modal closes
    useEffect(() => {
        if (!open) {
            setSearchQuery("")
            setSearchResults([])
            setLatitude("")
            setLongitude("")
            setColumnColor('')
            setColumnOrder('')
            setNodeColor('')
            setNodeX('')
            setNodeY('')
            setCalendarDate('')
            setEndDate('')
            setStartTime('')
            setEndTime('')
            setIsAllDay(true)
            setSlotColor('')
        }
    }, [open])

    // Update data when coordinates change (for map type)
    useEffect(() => {
        if (viewType === 'map' && latitude && longitude) {
            const lat = parseFloat(latitude)
            const lng = parseFloat(longitude)
            if (!isNaN(lat) && !isNaN(lng)) {
                setData(JSON.stringify({ lat, lng }))
            }
        }
    }, [latitude, longitude, viewType, setData])

    // Update data for kanban type (column creation)
    useEffect(() => {
        if (viewType === 'kanban') {
            const kanbanData: any = {}
            if (columnColor) {
                kanbanData.color = columnColor
            }
            if (columnOrder) {
                const order = parseInt(columnOrder)
                if (!isNaN(order)) {
                    kanbanData.order = order
                }
            }
            setData(JSON.stringify(kanbanData))
        }
    }, [columnColor, columnOrder, viewType, setData])

    // Update data for flow type (node creation)
    useEffect(() => {
        if (viewType === 'flow') {
            const flowData: any = {
                position: {
                    x: nodeX ? parseFloat(nodeX) : 100,
                    y: nodeY ? parseFloat(nodeY) : 100
                }
            }
            if (nodeColor) {
                flowData.color = nodeColor
            }
            setData(JSON.stringify(flowData))
        }
    }, [nodeColor, nodeX, nodeY, viewType, setData])

    // Update data for calendar type (slot creation)
    useEffect(() => {
        if (viewType === 'calendar' && calendarDate) {
            const calendarData: any = {
                date: calendarDate,
                is_all_day: isAllDay
            }
            if (endDate) {
                calendarData.end_date = endDate
            }
            if (!isAllDay && startTime) {
                calendarData.start_time = startTime
            }
            if (!isAllDay && endTime) {
                calendarData.end_time = endTime
            }
            if (slotColor) {
                calendarData.color = slotColor
            }
            setData(JSON.stringify(calendarData))
        }
    }, [calendarDate, endDate, startTime, endTime, isAllDay, slotColor, viewType, setData])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit()
    }

    const searchLocation = async () => {
        if (!searchQuery.trim()) return

        setIsSearching(true)
        setSearchResults([])

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?` +
                `q=${encodeURIComponent(searchQuery)}&format=json&limit=5`,
                {
                    headers: {
                        'Accept': 'application/json',
                    }
                }
            )

            if (response.ok) {
                const results = await response.json()
                setSearchResults(results)
            }
        } catch (error) {
            console.error('Nominatim search error:', error)
        } finally {
            setIsSearching(false)
        }
    }

    const selectLocation = (result: NominatimResult) => {
        setLatitude(result.lat)
        setLongitude(result.lon)
        if (!name) {
            setName(result.display_name.split(',')[0])
        }
        setSearchResults([])
        setSearchQuery("")
        setReverseGeocodedAddress(result.display_name)
    }

    // Reverse geocoding
    const reverseGeocode = async (lat: number, lng: number, forceUpdateName: boolean = false) => {
        setIsReverseGeocoding(true)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?` +
                `lat=${lat}&lon=${lng}&format=json`,
                {
                    headers: {
                        'Accept': 'application/json',
                    }
                }
            )

            if (response.ok) {
                const result = await response.json()
                setReverseGeocodedAddress(result.display_name || '')
                // Update name if it's empty OR if force update is requested (from map click)
                if (result.display_name && (!name || forceUpdateName)) {
                    setName(result.display_name.split(',')[0])
                }
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error)
        } finally {
            setIsReverseGeocoding(false)
        }
    }

    // Handle map click
    const handleMapClick = (lat: number, lng: number) => {
        setLatitude(lat.toString())
        setLongitude(lng.toString())
        reverseGeocode(lat, lng, true) // Pass true to always update name on map click
    }

    // Get current location
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert(t('views.geolocationNotSupported') || 'Geolocation is not supported by your browser')
            return
        }

        setIsGettingLocation(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude
                const lng = position.coords.longitude
                setLatitude(lat.toString())
                setLongitude(lng.toString())
                reverseGeocode(lat, lng)
                setIsGettingLocation(false)
            },
            (error) => {
                console.error('Geolocation error:', error)
                let errorMessage = t('views.locationError') || 'Could not get your location'
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = t('views.locationPermissionDenied') || 'Location permission denied'
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    errorMessage = t('views.locationUnavailable') || 'Location information unavailable'
                } else if (error.code === error.TIMEOUT) {
                    errorMessage = t('views.locationTimeout') || 'Location request timed out'
                }
                alert(errorMessage)
                setIsGettingLocation(false)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        )
    }

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

    const getTitle = () => {
        if (viewType === 'calendar') return t('views.createCalendarSlot')
        if (viewType === 'map') return t('views.createMapMarker')
        if (viewType === 'kanban') return t('views.createKanbanColumn') || 'Create Kanban Column'
        if (viewType === 'flow') return t('views.createFlowNode') || 'Create Flow Node'
        return 'Create Object'
    }

    const getNameLabel = () => {
        if (viewType === 'calendar') return t('views.slotName')
        if (viewType === 'map') return t('views.markerName')
        if (viewType === 'kanban') return t('views.columnName') || 'Column Name'
        if (viewType === 'flow') return t('views.nodeName') || 'Node Name'
        return 'Name'
    }

    const renderDataInput = () => {
        if (viewType === 'calendar') {
            return (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('views.startDate') || 'Start date'}
                            </label>
                            <input
                                type="date"
                                value={calendarDate}
                                onChange={(e) => setCalendarDate(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('views.endDate') || 'End date'} ({t('common.optional') || 'Optional'})
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                min={calendarDate}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isAllDay}
                                onChange={(e) => setIsAllDay(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium">
                                {t('views.allDay') || 'All day'}
                            </span>
                        </label>
                    </div>

                    {!isAllDay && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t('views.startTime') || 'Start time'}
                                </label>
                                <input
                                    type="text"
                                    pattern="[0-2][0-9]:[0-5][0-9]"
                                    placeholder="HH:mm"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t('views.endTime') || 'End time'}
                                </label>
                                <input
                                    type="text"
                                    pattern="[0-2][0-9]:[0-5][0-9]"
                                    placeholder="HH:mm"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                />
                            </div>
                        </div>
                    )}

                    {/* Color Picker (Optional) */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('views.color') || 'Color'} ({t('common.optional') || 'Optional'})
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={slotColor || '#3B82F6'}
                                onChange={(e) => setSlotColor(e.target.value)}
                                className="w-20 h-10 rounded-lg border dark:border-neutral-600 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={slotColor}
                                onChange={(e) => setSlotColor(e.target.value)}
                                placeholder="#3B82F6"
                                className="flex-1 px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                            />
                            {slotColor && (
                                <button
                                    type="button"
                                    onClick={() => setSlotColor('')}
                                    className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    {t('common.clear') || 'Clear'}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )
        }

        if (viewType === 'map') {
            return (
                <>
                    {/* Location Search */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('views.searchLocation')}
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        searchLocation()
                                    }
                                }}
                                className="flex-1 min-w-0 px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                placeholder={t('views.searchLocationPlaceholder')}
                            />
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                disabled={isGettingLocation}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                                title={t('views.getCurrentLocation') || 'Get current location'}
                            >
                                <Locate size={16} />
                            </button>
                            <button
                                type="button"
                                onClick={searchLocation}
                                disabled={isSearching || !searchQuery.trim()}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 flex items-center gap-2"
                            >
                                <Search size={16} />
                                {isSearching ? t('views.searching') : t('views.search')}
                            </button>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="mt-2 border dark:border-neutral-600 rounded-lg overflow-y-auto">
                                {searchResults.map((result, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => selectLocation(result)}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-start gap-2 border-b last:border-b-0 dark:border-neutral-600"
                                    >
                                        <MapPin size={16} className="mt-1 flex-shrink-0" />
                                        <span className="text-sm">{result.display_name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Interactive Map */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('views.selectOnMap') || 'Select on Map'}
                        </label>
                        <div className="h-64 rounded-lg overflow-hidden border dark:border-neutral-600 relative z-0">
                            {latitude && longitude && (
                                <MapContainer
                                    center={[parseFloat(latitude), parseFloat(longitude)]}
                                    zoom={13}
                                    className="h-full w-full z-0"
                                    scrollWheelZoom={true}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <MapClickHandler onLocationSelect={handleMapClick} />
                                    <Marker
                                        position={[parseFloat(latitude), parseFloat(longitude)]}
                                        icon={markerIcon}
                                    />
                                </MapContainer>
                            )}
                            {(!latitude || !longitude) && (
                                <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-neutral-900">
                                    <p className="text-sm text-gray-500">
                                        {t('views.searchOrEnterCoordinates') || 'Search or enter coordinates to see map'}
                                    </p>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {t('views.clickMapToSelect') || 'Click on the map to select a location'}
                        </p>

                        {/* Reverse Geocoded Address Display */}
                        {reverseGeocodedAddress && (
                            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                <div className="flex items-start gap-2">
                                    <Navigation size={14} className="mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                    <span className="text-xs text-blue-800 dark:text-blue-200">
                                        {reverseGeocodedAddress}
                                    </span>
                                </div>
                            </div>
                        )}
                        {isReverseGeocoding && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900/20 rounded">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {t('views.loadingAddress') || 'Loading address...'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Coordinates Input */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('views.coordinates')}
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                    {t('views.latitude')}
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                    placeholder="25.0330"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                    {t('views.longitude')}
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                    placeholder="121.5654"
                                />
                            </div>
                        </div>
                    </div>
                </>
            )
        }

        if (viewType === 'kanban') {
            return (
                <>
                    {/* Column Order (Optional) */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('views.order') || 'Order'} ({t('common.optional') || 'Optional'})
                        </label>
                        <input
                            type="number"
                            value={columnOrder}
                            onChange={(e) => setColumnOrder(e.target.value)}
                            placeholder="0"
                            className="w-full px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {t('views.columnOrderHint') || 'Lower numbers appear first'}
                        </p>
                    </div>

                    {/* Color Picker (Optional) */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('views.color') || 'Color'} ({t('common.optional') || 'Optional'})
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={columnColor || '#3B82F6'}
                                onChange={(e) => setColumnColor(e.target.value)}
                                className="w-20 h-10 rounded-lg border dark:border-neutral-600 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={columnColor}
                                onChange={(e) => setColumnColor(e.target.value)}
                                placeholder="#3B82F6"
                                className="flex-1 px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                            />
                            {columnColor && (
                                <button
                                    type="button"
                                    onClick={() => setColumnColor('')}
                                    className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    {t('common.clear') || 'Clear'}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )
        }

        if (viewType === 'flow') {
            return (
                <>
                    {/* Position */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('views.position') || 'Position'} ({t('common.optional') || 'Optional'})
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                    X
                                </label>
                                <input
                                    type="number"
                                    value={nodeX}
                                    onChange={(e) => setNodeX(e.target.value)}
                                    placeholder="100"
                                    className="w-full px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">
                                    Y
                                </label>
                                <input
                                    type="number"
                                    value={nodeY}
                                    onChange={(e) => setNodeY(e.target.value)}
                                    placeholder="100"
                                    className="w-full px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Color Picker (Optional) */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t('views.color') || 'Color'} ({t('common.optional') || 'Optional'})
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={nodeColor || '#FFFFFF'}
                                onChange={(e) => setNodeColor(e.target.value)}
                                className="w-20 h-10 rounded-lg border dark:border-neutral-600 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={nodeColor}
                                onChange={(e) => setNodeColor(e.target.value)}
                                placeholder="#FFFFFF"
                                className="flex-1 px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                            />
                            {nodeColor && (
                                <button
                                    type="button"
                                    onClick={() => setNodeColor('')}
                                    className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    {t('common.clear') || 'Clear'}
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )
        }

        return null
    }

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-2">
                    {getNameLabel()}
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                    placeholder={t('views.enterName')}
                    autoFocus
                />
            </div>

            {renderDataInput()}

            <div className="flex gap-3 justify-end mt-6">
                {!inline ? (
                    <Dialog.Close asChild>
                        <button
                            type="button"
                            className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                            {t('common.cancel')}
                        </button>
                    </Dialog.Close>
                ) : (
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                        {t('common.cancel')}
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting || !name.trim() || (viewType === 'map' && (!latitude || !longitude))}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? t('common.creating') : t('common.create')}
                </button>
            </div>
        </form>
    )

    if (inline) {
        return <div className="space-y-4">{formContent}</div>
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1000]" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[500px] z-[1001] max-h-[85vh] overflow-y-auto">
                    <Dialog.Title className="text-xl font-semibold mb-4">
                        {getTitle()}
                    </Dialog.Title>
                    {formContent}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default CreateViewObjectModal
