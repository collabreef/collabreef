import { Dialog } from "radix-ui"
import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { MapViewData, View } from "@/types/view"
import { updateView } from "@/api/view"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToastStore } from "@/stores/toast"

interface MapViewSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    view: View
    workspaceId: string
}

const MapViewSettingsModal = ({
    open,
    onOpenChange,
    view,
    workspaceId
}: MapViewSettingsModalProps) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { addToast } = useToastStore()

    const [centerLat, setCenterLat] = useState("")
    const [centerLng, setCenterLng] = useState("")
    const [zoom, setZoom] = useState("")

    // Parse existing view data when modal opens
    useEffect(() => {
        if (open && view.data) {
            try {
                const mapData: MapViewData = JSON.parse(view.data)
                if (mapData.center) {
                    setCenterLat(mapData.center.lat.toString())
                    setCenterLng(mapData.center.lng.toString())
                }
                if (mapData.zoom !== undefined) {
                    setZoom(mapData.zoom.toString())
                }
            } catch (e) {
                console.error('Failed to parse view data:', e)
            }
        }
    }, [open, view.data])

    // Reset form when modal closes
    useEffect(() => {
        if (!open) {
            setCenterLat("")
            setCenterLng("")
            setZoom("")
        }
    }, [open])

    const updateMutation = useMutation({
        mutationFn: (data: string) => updateView(workspaceId, view.id, { data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['view', workspaceId, view.id] })
            queryClient.invalidateQueries({ queryKey: ['views', workspaceId] })
            addToast({ type: 'success', title: t('views.settingsUpdated') || 'Settings updated successfully' })
            onOpenChange(false)
        },
        onError: () => {
            addToast({ type: 'error', title: t('views.settingsUpdateError') || 'Failed to update settings' })
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const mapData: MapViewData = {}

        const lat = parseFloat(centerLat)
        const lng = parseFloat(centerLng)
        const zoomValue = parseInt(zoom)

        if (!isNaN(lat) && !isNaN(lng)) {
            mapData.center = { lat, lng }
        }

        if (!isNaN(zoomValue) && zoomValue >= 1 && zoomValue <= 20) {
            mapData.zoom = zoomValue
        }

        // Only update if there's valid data
        if (Object.keys(mapData).length > 0) {
            updateMutation.mutate(JSON.stringify(mapData))
        } else {
            addToast({ type: 'error', title: 'Please provide valid settings' })
        }
    }

    const handleClear = () => {
        updateMutation.mutate("")
        setCenterLat("")
        setCenterLng("")
        setZoom("")
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1000]" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[500px] z-[1001] max-h-[85vh] overflow-y-auto">
                    <Dialog.Title className="text-xl font-semibold mb-4">
                        {t('views.mapSettings') || 'Map Settings'}
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Map Center */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('views.defaultMapCenter') || 'Default Map Center'}
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                        {t('views.latitude') || 'Latitude'}
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={centerLat}
                                        onChange={(e) => setCenterLat(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                        placeholder="25.0330"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">
                                        {t('views.longitude') || 'Longitude'}
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={centerLng}
                                        onChange={(e) => setCenterLng(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                        placeholder="121.5654"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Zoom Level */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('views.defaultZoom') || 'Default Zoom Level'}
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={zoom}
                                onChange={(e) => setZoom(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                placeholder="12"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {t('views.zoomRange') || 'Zoom level (1-20). Higher numbers show more detail.'}
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                type="button"
                                onClick={handleClear}
                                disabled={updateMutation.isPending}
                                className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                            >
                                {t('views.clearSettings') || 'Clear Settings'}
                            </button>
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
                                disabled={updateMutation.isPending}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updateMutation.isPending ? t('common.saving') || 'Saving...' : t('common.save')}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default MapViewSettingsModal