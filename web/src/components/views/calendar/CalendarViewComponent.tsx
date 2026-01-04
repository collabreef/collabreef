import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTwoColumn } from '@/components/twocolumn/TwoColumn'
import { useTranslation } from 'react-i18next'
import { CalendarSlotData } from '@/types/view'

interface CalendarViewComponentProps {
    viewObjects?: any[]
    focusedObjectId?: string
    isPublic?: boolean
}

const CalendarViewComponent = ({ viewObjects = [], focusedObjectId, isPublic = false }: CalendarViewComponentProps) => {
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
                const slotData: CalendarSlotData = JSON.parse(focusedObj.data)
                const date = new Date(slotData.date)
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

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Get the first day of the month
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDayOfMonth.getDay()

    // Get total days in month
    const daysInMonth = lastDayOfMonth.getDate()

    // Generate calendar days with previous/next month dates
    const calendarDays: Array<{ day: number; isCurrentMonth: boolean; year: number; month: number }> = []

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const prevMonth = month === 0 ? 11 : month - 1
        const prevYear = month === 0 ? year - 1 : year
        calendarDays.push({
            day: prevMonthLastDay - i,
            isCurrentMonth: false,
            year: prevYear,
            month: prevMonth
        })
    }

    // Add all days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push({
            day,
            isCurrentMonth: true,
            year,
            month
        })
    }

    // Add days from next month to complete the grid
    const remainingCells = 7 - (calendarDays.length % 7)
    if (remainingCells < 7) {
        const nextMonth = month === 11 ? 0 : month + 1
        const nextYear = month === 11 ? year + 1 : year
        for (let day = 1; day <= remainingCells; day++) {
            calendarDays.push({
                day,
                isCurrentMonth: false,
                year: nextYear,
                month: nextMonth
            })
        }
    }

    const monthNames = Array.from({ length: 12 }, (_, i) => t(`time.monthsFull.${i}`))
    const weekDays = Array.from({ length: 7 }, (_, i) => t(`time.weekDays.${i}`))

    const previousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    const today = new Date()
    const isToday = (dayObj: { day: number; isCurrentMonth: boolean; year: number; month: number }) => {
        return (
            dayObj.day === today.getDate() &&
            dayObj.month === today.getMonth() &&
            dayObj.year === today.getFullYear()
        )
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

    // Parse date string (YYYY-MM-DD) to avoid timezone issues
    const parseDate = (dateStr: string) => {
        const parts = dateStr.split('-')
        if (parts.length !== 3) return null

        const year = parseInt(parts[0], 10)
        const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
        const day = parseInt(parts[2], 10)

        if (isNaN(year) || isNaN(month) || isNaN(day)) return null

        return { year, month, day }
    }

    // Get slots for a specific day (only for current month)
    const getSlotsForDay = (dayObj: { day: number; isCurrentMonth: boolean; year: number; month: number }) => {
        // Don't show slots for previous/next month days
        if (!dayObj.isCurrentMonth || !viewObjects) return []

        return viewObjects.filter(obj => {
            if (!obj.data) return false

            const slotData = parseSlotData(obj.data)
            if (!slotData) return false

            const parsed = parseDate(slotData.date)
            if (!parsed) return false

            return (
                parsed.day === dayObj.day &&
                parsed.month === dayObj.month &&
                parsed.year === dayObj.year
            )
        })
    }

    return (
        <div className="">
            <div className="mb-6">
                <div className="flex items-center justify-between px-2">
                    <div className="text-2xl font-semibold">
                        {monthNames[month]} {year}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={previousMonth}
                            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title={t('views.previousMonth')}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-4 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
                        >
                            {t('views.today')}
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title={t('views.nextMonth')}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 ">
                    {/* Week day headers */}
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="text-center font-semibold text-sm py-2 text-gray-600 dark:text-gray-400"
                        >
                            {day}
                        </div>
                    ))}

                    {/* Calendar days */}
                    {calendarDays.map((dayObj, index) => {
                        const daySlots = getSlotsForDay(dayObj)
                        const slotCount = daySlots.length
                        const isTodayCell = isToday(dayObj)

                        return (
                            <div
                                key={index}
                                className={`
                                    aspect-square p-2 border dark:border-neutral-700 overflow-y-auto
                                    ${isTodayCell ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-neutral-900'}
                                    ${dayObj.isCurrentMonth ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer' : ''}
                                    ${dayObj.isCurrentMonth && slotCount > 0 ? 'border-blue-400 dark:border-blue-600' : ''}
                                    transition-colors
                                `}
                            >
                                <div className="h-full flex flex-col justify-between">
                                    <div className={`
                                        text-sm font-medium
                                        ${isTodayCell ? 'text-blue-600 dark:text-blue-400' : ''}
                                        ${dayObj.isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}
                                    `}>
                                        {dayObj.day}
                                    </div>
                                    {slotCount > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {daySlots.slice(0, 3).map((slot, i) => {
                                                const slotData = parseSlotData(slot.data)
                                                const timeLabel = slotData && !slotData.is_all_day && slotData.start_time
                                                    ? ` ${slotData.start_time}`
                                                    : ''

                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            openBottomSheet()
                                                            const path = isPublic
                                                                ? `/explore/calendar/${calendarId}/slot/${slot.id}`
                                                                : `/workspaces/${workspaceId}/calendar/${calendarId}/slot/${slot.id}`
                                                            navigate(path)
                                                        }}
                                                        className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded truncate max-w-full hover:bg-blue-600 transition-colors"
                                                        title={`${slot.name}${timeLabel}`}
                                                    >
                                                        {timeLabel && <span className="opacity-75">{timeLabel}</span>}
                                                        {timeLabel && ' '}
                                                        {slot.name}
                                                    </button>
                                                )
                                            })}
                                            {slotCount > 3 && (
                                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                    +{slotCount - 3}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

        </div>
    )
}

export default CalendarViewComponent