import { Dialog } from "radix-ui"
import { useTranslation } from "react-i18next"
import { ViewType } from "@/types/view"
import { useState, useEffect } from "react"
import { Search, MapPin } from "lucide-react"

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
}

interface NominatimResult {
    lat: string
    lon: string
    display_name: string
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
    isSubmitting
}: CreateViewObjectModalProps) => {
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = useState("")
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<NominatimResult[]>([])
    const [latitude, setLatitude] = useState("")
    const [longitude, setLongitude] = useState("")

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

    // Reset search state when modal closes
    useEffect(() => {
        if (!open) {
            setSearchQuery("")
            setSearchResults([])
            setLatitude("")
            setLongitude("")
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
    }

    const getTitle = () => {
        if (viewType === 'calendar') return t('views.createCalendarSlot')
        if (viewType === 'map') return t('views.createMapMarker')
        return 'Create Object'
    }

    const getNameLabel = () => {
        if (viewType === 'calendar') return t('views.slotName')
        if (viewType === 'map') return t('views.markerName')
        return 'Name'
    }

    const renderDataInput = () => {
        if (viewType === 'calendar') {
            return (
                <div>
                    <label className="block text-sm font-medium mb-2">
                        {t('views.date')}
                    </label>
                    <input
                        type="date"
                        value={data}
                        onChange={(e) => setData(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                    />
                </div>
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
                                className="flex-1 px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                placeholder={t('views.searchLocationPlaceholder')}
                            />
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
                            <div className="mt-2 border dark:border-neutral-600 rounded-lg max-h-48 overflow-y-auto">
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

        return null
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[500px] z-50 max-h-[85vh] overflow-y-auto">
                    <Dialog.Title className="text-xl font-semibold mb-4">
                        {getTitle()}
                    </Dialog.Title>

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
                            <Dialog.Close asChild>
                                <button
                                    type="button"
                                    className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    {t('common.cancel')}
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                disabled={isSubmitting || !name.trim() || (viewType === 'map' && (!latitude || !longitude))}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? t('common.creating') : t('common.create')}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default CreateViewObjectModal
