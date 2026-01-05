import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTwoColumn } from '@/components/twocolumn/TwoColumn'
import { useTranslation } from 'react-i18next'
import { ViewObject, CalendarSlotData } from '@/types/view'

interface CalendarDayViewProps {
    viewObjects?: ViewObject[]
    focusedObjectId?: string
    isPublic?: boolean
}

const CalendarDayView = ({ viewObjects = [], focusedObjectId, isPublic = false }: CalendarDayViewProps) => {
    const navigate = useNavigate()
    const { workspaceId, calendarId } = useParams<{ workspaceId?: string; calendarId: string }>()
    const { openBottomSheet } = useTwoColumn()
    const { t } = useTranslation()

    // Find the focused object's date
    const focusedDate = useMemo(() => {
        if (!focusedObjectId || !viewObjects) return null
        const focusedObj = viewObjects.find(obj => obj.id === focusedObjectId)
        if (focusedObj && focusedObj.data) {
            try {
                const data: CalendarSlotData = JSON.parse(focusedObj.data)
                const date = new Date(data.date)
                if (!isNaN(date.getTime())) {
                    return date
                }
            } catch {
                // Fallback for old format
                const date = new Date(focusedObj.data)
                if (!isNaN(date.getTime())) {
                    return date
                }
            }
        }
        return null
    }, [focusedObjectId, viewObjects])

    const [currentDate, setCurrentDate] = useState(focusedDate || new Date())

    // Update currentDate when focusedDate changes
    useEffect(() => {
        if (focusedDate) {
            setCurrentDate(focusedDate)
        }
    }, [focusedDate])

    // Generate time slots (24 hours)
    const timeSlots = Array.from({ length: 24 }, (_, i) => {
        return { hour: i }
    })

    const previousDay = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(currentDate.getDate() - 1)
        setCurrentDate(newDate)
    }

    const nextDay = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(currentDate.getDate() + 1)
        setCurrentDate(newDate)
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    // Parse slot data
    const parseSlotData = (dataStr: string): CalendarSlotData | null => {
        try {
            return JSON.parse(dataStr)
        } catch {
            // Fallback for old format (just a date string)
            return { date: dataStr, is_all_day: true }
        }
    }

    // Get timed events for the current day
    const getTimedEvents = () => {
        const dateStr = currentDate.toISOString().split('T')[0]

        return viewObjects
            .filter(obj => {
                if (!obj.data) return false

                const slotData = parseSlotData(obj.data)
                if (!slotData || slotData.date !== dateStr) return false

                // Only timed events (not all-day)
                return !slotData.is_all_day && slotData.start_time
            })
            .map(obj => {
                const slotData = parseSlotData(obj.data)!
                const [startHour, startMinute] = slotData.start_time!.split(':').map(Number)
                const startTotalMinutes = startHour * 60 + startMinute

                let endTotalMinutes = startTotalMinutes + 60 // Default 1 hour duration
                if (slotData.end_time) {
                    const [endHour, endMinute] = slotData.end_time.split(':').map(Number)
                    endTotalMinutes = endHour * 60 + endMinute
                }

                const durationMinutes = endTotalMinutes - startTotalMinutes

                return {
                    ...obj,
                    startMinutes: startTotalMinutes,
                    durationMinutes,
                    slotData
                }
            })
    }

    // Get all-day events for the current day
    const getAllDayEvents = () => {
        const dateStr = currentDate.toISOString().split('T')[0]

        return viewObjects.filter(obj => {
            if (!obj.data) return false

            const slotData = parseSlotData(obj.data)
            if (!slotData || slotData.date !== dateStr) return false

            return slotData.is_all_day || !slotData.start_time
        })
    }

    const today = new Date()
    const isToday = currentDate.toDateString() === today.toDateString()

    const weekDayNames = Array.from({ length: 7 }, (_, i) => t(`time.weekDays.${i}`))

    const handleSlotClick = (slot: ViewObject) => {
        openBottomSheet()
        const path = isPublic
            ? `/explore/calendar/${calendarId}/slot/${slot.id}`
            : `/workspaces/${workspaceId}/calendar/${calendarId}/slot/${slot.id}`
        navigate(path)
    }

    const allDayEvents = getAllDayEvents()
    const timedEvents = getTimedEvents()

    return (
        <div className="">
            <div className="mb-4">
                <div className="flex items-center justify-between px-2 mb-4">
                    <div className="text-2xl font-semibold">
                        {weekDayNames[currentDate.getDay()]}, {currentDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={previousDay}
                            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title={t('views.previousDay') || 'Previous day'}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={goToToday}
                            className="px-4 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
                        >
                            {t('views.today')}
                        </button>
                        <button
                            onClick={nextDay}
                            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title={t('views.nextDay') || 'Next day'}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Day view */}
                <div className="border dark:border-neutral-700 rounded-lg overflow-auto max-h-[calc(100dvh-140px)]">
                    {/* All-day events section */}
                    {allDayEvents.length > 0 && (
                        <div className="bg-neutral-50 dark:bg-neutral-800 border-b dark:border-neutral-700 p-3">
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                {t('views.allDay') || 'All day'}
                            </div>
                            <div className="flex gap-1 overflow-auto">
                                {allDayEvents.map((slot) => (
                                    <button
                                        key={slot.id}
                                        onClick={() => handleSlotClick(slot)}
                                        className="text-sm px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-left"
                                        title={slot.name}
                                    >
                                        {slot.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Time grid */}
                    <div className="overflow-y-auto relative">
                        {/* Time slot grid */}
                        {timeSlots.map(({ hour }) => {
                            const timeStr = `${hour.toString().padStart(2, '0')}:00`

                            return (
                                <div
                                    key={hour}
                                    className={`flex border-b dark:border-neutral-700 ${
                                        hour === 0 ? 'border-t-2 dark:border-t-neutral-600' : ''
                                    } ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                >
                                    <div className="w-20 p-2 text-xs font-medium text-gray-600 dark:text-gray-400 border-r dark:border-neutral-700">
                                        {timeStr}
                                    </div>
                                    <div className="flex-1 p-2 min-h-[80px] relative">
                                        {/* Half-hour divider line */}
                                        <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-neutral-200 dark:border-neutral-700/50" />
                                    </div>
                                </div>
                            )
                        })}

                        {/* Absolutely positioned events */}
                        {timedEvents.map((event) => {
                            // Each hour slot is 80px tall (min-h-[80px]), so 30 minutes = 40px
                            const pixelsPerMinute = 80 / 60 // 80px per hour
                            const topPosition = event.startMinutes * pixelsPerMinute
                            const height = event.durationMinutes * pixelsPerMinute

                            return (
                                <button
                                    key={event.id}
                                    onClick={() => handleSlotClick(event)}
                                    className="absolute text-sm px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-left overflow-hidden max-w-36 w-auto"
                                    style={{
                                        top: `${topPosition + 8}px`, // Add p-2 (8px) top padding offset
                                        left: 'calc(5rem + 1px + 0.5rem)', // w-20 (5rem) + border (1px) + p-2 left padding (0.5rem)
                                        right: '0.5rem', // p-2 right padding
                                        height: `${Math.max(height - 4, 24)}px`, // Slight adjustment for visual spacing, minimum 24px
                                        zIndex: 10
                                    }}
                                    title={event.name}
                                >
                                    <div className="font-medium truncate">{event.name}</div>
                                    {event.slotData.start_time && (
                                        <div className="text-xs opacity-90 truncate">
                                            {event.slotData.start_time}
                                            {event.slotData.end_time && ` - ${event.slotData.end_time}`}
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CalendarDayView
