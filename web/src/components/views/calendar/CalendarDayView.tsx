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

    // Generate time slots (24 hours, with 30-minute intervals)
    const timeSlots = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2)
        const minute = (i % 2) * 30
        return { hour, minute }
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

    // Get slots for a specific time slot
    const getSlotsForTimeSlot = (hour: number, minute: number) => {
        const dateStr = currentDate.toISOString().split('T')[0]

        return viewObjects.filter(obj => {
            if (!obj.data) return false

            const slotData = parseSlotData(obj.data)
            if (!slotData || slotData.date !== dateStr) return false

            // All-day events don't appear in time slots
            if (slotData.is_all_day) return false

            // Check if event overlaps with this time slot
            if (slotData.start_time) {
                const [startHour, startMinute] = slotData.start_time.split(':').map(Number)
                const startTotalMinutes = startHour * 60 + startMinute

                let endTotalMinutes = startTotalMinutes + 60 // Default 1 hour duration
                if (slotData.end_time) {
                    const [endHour, endMinute] = slotData.end_time.split(':').map(Number)
                    endTotalMinutes = endHour * 60 + endMinute
                }

                const slotTotalMinutes = hour * 60 + minute
                const slotEndMinutes = slotTotalMinutes + 30

                return slotTotalMinutes < endTotalMinutes && slotEndMinutes > startTotalMinutes
            }

            return false
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
                <div className="border dark:border-neutral-700 rounded-lg overflow-hidden max-h-[calc(100dvh-140px)]">
                    {/* All-day events section */}
                    {allDayEvents.length > 0 && (
                        <div className="bg-neutral-50 dark:bg-neutral-800 border-b dark:border-neutral-700 p-3">
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                {t('views.allDay') || 'All day'}
                            </div>
                            <div className="flex flex-col gap-1">
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
                    <div className="overflow-y-auto max-h-[600px]">
                        {timeSlots.map(({ hour, minute }) => {
                            const slots = getSlotsForTimeSlot(hour, minute)
                            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`

                            return (
                                <div
                                    key={`${hour}-${minute}`}
                                    className={`flex border-b dark:border-neutral-700 ${
                                        minute === 0 ? 'border-t-2 dark:border-t-neutral-600' : ''
                                    } ${isToday ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                >
                                    <div className="w-20 p-2 text-xs font-medium text-gray-600 dark:text-gray-400 border-r dark:border-neutral-700">
                                        {minute === 0 ? timeStr : ''}
                                    </div>
                                    <div className="flex-1 p-2 min-h-[40px]">
                                        <div className="flex flex-col gap-1">
                                            {slots.map((slot) => (
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
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CalendarDayView
