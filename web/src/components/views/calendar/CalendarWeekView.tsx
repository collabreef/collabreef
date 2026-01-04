import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTwoColumn } from '@/components/twocolumn/TwoColumn'
import { useTranslation } from 'react-i18next'
import { ViewObject, CalendarSlotData } from '@/types/view'

interface CalendarWeekViewProps {
    viewObjects?: ViewObject[]
    focusedObjectId?: string
    isPublic?: boolean
}

const CalendarWeekView = ({ viewObjects = [], focusedObjectId, isPublic = false }: CalendarWeekViewProps) => {
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

    // Get the start of the week (Sunday)
    const getWeekStart = (date: Date) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day
        return new Date(d.setDate(diff))
    }

    const weekStart = getWeekStart(currentDate)

    // Generate array of 7 days starting from Sunday
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(weekStart)
        day.setDate(weekStart.getDate() + i)
        return day
    })

    // Generate time slots (24 hours)
    const timeSlots = Array.from({ length: 24 }, (_, i) => i)

    const previousWeek = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(currentDate.getDate() - 7)
        setCurrentDate(newDate)
    }

    const nextWeek = () => {
        const newDate = new Date(currentDate)
        newDate.setDate(currentDate.getDate() + 7)
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

    // Get slots for a specific day and time
    const getSlotsForDayAndTime = (day: Date, hour: number) => {
        const dateStr = day.toISOString().split('T')[0]

        return viewObjects.filter(obj => {
            if (!obj.data) return false

            const slotData = parseSlotData(obj.data)
            if (!slotData || slotData.date !== dateStr) return false

            // All-day events don't appear in hourly slots
            if (slotData.is_all_day) return false

            // Check if event overlaps with this hour
            if (slotData.start_time) {
                const startHour = parseInt(slotData.start_time.split(':')[0], 10)
                const endHour = slotData.end_time
                    ? parseInt(slotData.end_time.split(':')[0], 10)
                    : startHour + 1

                return hour >= startHour && hour < endHour
            }

            return false
        })
    }

    // Get all-day events for a specific day
    const getAllDayEvents = (day: Date) => {
        const dateStr = day.toISOString().split('T')[0]

        return viewObjects.filter(obj => {
            if (!obj.data) return false

            const slotData = parseSlotData(obj.data)
            if (!slotData || slotData.date !== dateStr) return false

            return slotData.is_all_day || !slotData.start_time
        })
    }

    const weekDayNames = Array.from({ length: 7 }, (_, i) => t(`time.weekDays.${i}`))

    const today = new Date()
    const isToday = (day: Date) => {
        return day.toDateString() === today.toDateString()
    }

    const handleSlotClick = (slot: ViewObject) => {
        openBottomSheet()
        const path = isPublic
            ? `/explore/calendar/${calendarId}/slot/${slot.id}`
            : `/workspaces/${workspaceId}/calendar/${calendarId}/slot/${slot.id}`
        navigate(path)
    }

    return (
        <div className="">
            <div className="mb-4">
                <div className="flex items-center justify-between px-2 mb-4">
                    <div className="text-2xl font-semibold">
                        {weekDays[0].toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={previousWeek}
                            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title={t('views.previousWeek') || 'Previous week'}
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
                            onClick={nextWeek}
                            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title={t('views.nextWeek') || 'Next week'}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Week view grid */}
                <div className="border dark:border-neutral-700 rounded-lg overflow-hidden">
                    {/* Header row with day names and dates */}
                    <div className="flex bg-neutral-50 dark:bg-neutral-800 border-b dark:border-neutral-700">
                        <div className="w-16 p-2 text-sm font-semibold text-gray-600 dark:text-gray-400"></div>
                        {weekDays.map((day, i) => (
                            <div
                                key={i}
                                className={`flex-1 p-2 text-center border-l dark:border-neutral-700 ${
                                    isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                                }`}
                            >
                                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                    {weekDayNames[i]}
                                </div>
                                <div className={`text-sm font-medium ${
                                    isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                    {day.getDate()}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* All-day events row */}
                    <div className="flex bg-neutral-50 dark:bg-neutral-800 border-b dark:border-neutral-700">
                        <div className="w-16 p-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
                            {t('views.allDay') || 'All day'}
                        </div>
                        {weekDays.map((day, i) => {
                            const allDayEvents = getAllDayEvents(day)
                            return (
                                <div
                                    key={i}
                                    className="flex-1 p-1 border-l dark:border-neutral-700 min-h-[40px]"
                                >
                                    <div className="flex flex-col gap-1">
                                        {allDayEvents.map((slot) => (
                                            <button
                                                key={slot.id}
                                                onClick={() => handleSlotClick(slot)}
                                                className="text-xs px-2 py-1 bg-blue-500 text-white rounded truncate hover:bg-blue-600 transition-colors"
                                                title={slot.name}
                                            >
                                                {slot.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Time grid */}
                    <div className="overflow-y-auto max-h-[calc(100dvh-230px)]">
                        {timeSlots.map((hour) => (
                            <div key={hour} className="flex border-b dark:border-neutral-700">
                                <div className="w-16 p-2 text-xs font-medium text-gray-600 dark:text-gray-400 border-r dark:border-neutral-700">
                                    {hour.toString().padStart(2, '0')}:00
                                </div>
                                {weekDays.map((day, i) => {
                                    const slots = getSlotsForDayAndTime(day, hour)
                                    return (
                                        <div
                                            key={i}
                                            className={`flex-1 p-1 border-l dark:border-neutral-700 min-h-[60px] ${
                                                isToday(day) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                                            }`}
                                        >
                                            <div className="flex flex-col gap-1">
                                                {slots.map((slot) => (
                                                    <button
                                                        key={slot.id}
                                                        onClick={() => handleSlotClick(slot)}
                                                        className="text-xs px-2 py-1 bg-blue-500 text-white rounded truncate hover:bg-blue-600 transition-colors"
                                                        title={slot.name}
                                                    >
                                                        {slot.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CalendarWeekView
