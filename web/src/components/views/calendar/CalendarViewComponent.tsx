import { useState, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'

interface CalendarViewComponentProps {
    viewObjects?: any[]
    focusedObjectId?: string
    isPublic?: boolean
}

const CalendarViewComponent = ({ viewObjects = [], focusedObjectId, isPublic = false }: CalendarViewComponentProps) => {
    const navigate = useNavigate()
    const { workspaceId, viewId } = useParams<{ workspaceId?: string; viewId: string }>()

    // Find the focused object's date
    const focusedDate = useMemo(() => {
        if (!focusedObjectId || !viewObjects) return null
        const focusedObj = viewObjects.find(obj => obj.id === focusedObjectId)
        if (focusedObj && focusedObj.data) {
            const date = new Date(focusedObj.data)
            if (!isNaN(date.getTime())) {
                return date
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

    // Generate calendar days
    const calendarDays: (number | null)[] = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
        calendarDays.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day)
    }

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const previousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    const today = new Date()
    const isToday = (day: number | null) => {
        if (!day) return false
        return (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        )
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

    // Check if a day has any slots
    const hasSlots = (day: number | null) => {
        if (!day || !viewObjects) return false

        // Check if any viewObject has a date matching this day
        return viewObjects.some(obj => {
            if (!obj.data) return false

            const parsed = parseDate(obj.data)
            if (!parsed) return false

            return (
                parsed.day === day &&
                parsed.month === month &&
                parsed.year === year
            )
        })
    }

    // Get slots for a specific day
    const getSlotsForDay = (day: number | null) => {
        if (!day || !viewObjects) return []

        return viewObjects.filter(obj => {
            if (!obj.data) return false

            const parsed = parseDate(obj.data)
            if (!parsed) return false

            return (
                parsed.day === day &&
                parsed.month === month &&
                parsed.year === year
            )
        })
    }

    return (
        <div className="p-6 rounded-lg border dark:border-neutral-700">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-semibold">
                        {monthNames[month]} {year}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={previousMonth}
                            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Previous month"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-4 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
                        >
                            Today
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Next month"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
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
                    {calendarDays.map((day, index) => {
                        const daySlots = getSlotsForDay(day)
                        const slotCount = daySlots.length

                        return (
                            <div
                                key={index}
                                className={`
                                    aspect-square p-2 rounded-lg border dark:border-neutral-700 overflow-y-auto
                                    ${day ? 'hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer' : 'border-transparent'}
                                    ${isToday(day) ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-neutral-900'}
                                    ${slotCount > 0 ? 'border-blue-400 dark:border-blue-600' : ''}
                                    transition-colors
                                `}
                            >
                                {day && (
                                    <div className="h-full flex flex-col justify-between">
                                        <div className={`
                                            text-sm font-medium
                                            ${isToday(day) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
                                        `}>
                                            {day}
                                        </div>
                                        {slotCount > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {daySlots.slice(0, 3).map((slot, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            const path = isPublic
                                                                ? `/explore/views/${viewId}/objects/${slot.id}`
                                                                : `/workspaces/${workspaceId}/views/${viewId}/objects/${slot.id}`
                                                            navigate(path)
                                                        }}
                                                        className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded truncate max-w-full hover:bg-blue-600 transition-colors"
                                                        title={slot.name}
                                                    >
                                                        {slot.name}
                                                    </button>
                                                ))}
                                                {slotCount > 3 && (
                                                    <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                        +{slotCount - 3}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

        </div>
    )
}

export default CalendarViewComponent