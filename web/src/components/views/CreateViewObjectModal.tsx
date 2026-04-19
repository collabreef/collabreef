import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { ViewType } from '@/types/view'

interface CreateViewObjectModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    viewType: ViewType
    name: string
    setName: (value: string) => void
    data: string
    setData: (value: string) => void
    onSubmit: () => void
    isSubmitting?: boolean
    /** If true, renders the form inline (no dialog overlay) */
    inline?: boolean
}

const CreateViewObjectModal = ({
    open,
    onOpenChange,
    viewType,
    name,
    setName,
    data: _data,
    setData,
    onSubmit,
    isSubmitting = false,
    inline = false,
}: CreateViewObjectModalProps) => {
    const { t } = useTranslation()

    // Parse / build structured data for each view type
    const [calendarDate, setCalendarDate] = useState('')
    const [calendarIsAllDay, setCalendarIsAllDay] = useState(true)
    const [calendarStartTime, setCalendarStartTime] = useState('')
    const [calendarEndTime, setCalendarEndTime] = useState('')
    const [mapLat, setMapLat] = useState('')
    const [mapLng, setMapLng] = useState('')
    const [columnColor, setColumnColor] = useState('')

    // Sync structured fields into the `data` JSON string
    useEffect(() => {
        if (viewType === 'calendar') {
            const d: any = { date: calendarDate, is_all_day: calendarIsAllDay }
            if (!calendarIsAllDay && calendarStartTime) d.start_time = calendarStartTime
            if (!calendarIsAllDay && calendarEndTime) d.end_time = calendarEndTime
            setData(JSON.stringify(d))
        } else if (viewType === 'map') {
            const lat = parseFloat(mapLat)
            const lng = parseFloat(mapLng)
            if (!isNaN(lat) && !isNaN(lng)) {
                setData(JSON.stringify({ lat, lng }))
            }
        } else if (viewType === 'kanban') {
            setData(JSON.stringify({ color: columnColor || undefined }))
        }
    }, [viewType, calendarDate, calendarIsAllDay, calendarStartTime, calendarEndTime, mapLat, mapLng, columnColor])

    const isValid = () => {
        if (!name.trim()) return false
        if (viewType === 'calendar' && !calendarDate) return false
        if (viewType === 'map' && (isNaN(parseFloat(mapLat)) || isNaN(parseFloat(mapLng)))) return false
        return true
    }

    const form = (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium mb-1">{t('views.name', 'Name')}</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('views.enterName', 'Enter name')}
                    className="w-full px-3 py-2 border dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {viewType === 'calendar' && (
                <>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('views.date', 'Date')}</label>
                        <input
                            type="date"
                            value={calendarDate}
                            onChange={(e) => setCalendarDate(e.target.value)}
                            className="w-full px-3 py-2 border dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                        />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={calendarIsAllDay}
                            onChange={(e) => setCalendarIsAllDay(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm">{t('views.allDay', 'All day')}</span>
                    </label>
                    {!calendarIsAllDay && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('views.startTime', 'Start time')}</label>
                                <input type="text" inputMode="numeric" pattern="[0-2][0-9]:[0-5][0-9]" placeholder="HH:mm"
                                    value={calendarStartTime} onChange={(e) => setCalendarStartTime(e.target.value)}
                                    className="w-full px-3 py-2 border dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">{t('views.endTime', 'End time')}</label>
                                <input type="text" inputMode="numeric" pattern="[0-2][0-9]:[0-5][0-9]" placeholder="HH:mm"
                                    value={calendarEndTime} onChange={(e) => setCalendarEndTime(e.target.value)}
                                    className="w-full px-3 py-2 border dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800" />
                            </div>
                        </div>
                    )}
                </>
            )}

            {viewType === 'map' && (
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('views.latitude', 'Latitude')}</label>
                        <input type="number" step="any" value={mapLat} onChange={(e) => setMapLat(e.target.value)}
                            placeholder="25.0330"
                            className="w-full px-3 py-2 border dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t('views.longitude', 'Longitude')}</label>
                        <input type="number" step="any" value={mapLng} onChange={(e) => setMapLng(e.target.value)}
                            placeholder="121.5654"
                            className="w-full px-3 py-2 border dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800" />
                    </div>
                </div>
            )}

            {viewType === 'kanban' && (
                <div>
                    <label className="block text-sm font-medium mb-1">{t('views.color', 'Color')}</label>
                    <input type="color" value={columnColor || '#3b82f6'} onChange={(e) => setColumnColor(e.target.value)}
                        className="w-full h-10 border dark:border-neutral-600 rounded-lg cursor-pointer" />
                </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    disabled={isSubmitting}
                >
                    {t('common.cancel', 'Cancel')}
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={isSubmitting || !isValid()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? t('common.saving', 'Saving...') : t('common.create', 'Create')}
                </button>
            </div>
        </div>
    )

    if (inline) {
        return open ? <div>{form}</div> : null
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[480px] z-50">
                    <div className="flex items-center justify-between mb-4">
                        <Dialog.Title className="text-xl font-semibold">
                            {t('views.createObject', 'Create')}
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded">
                                <X size={20} />
                            </button>
                        </Dialog.Close>
                    </div>
                    {form}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default CreateViewObjectModal
