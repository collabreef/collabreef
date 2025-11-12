import { FC, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { CalendarSlotData, ViewObject } from '@/types/view'
import { Link } from 'react-router-dom'

interface MiniCalendarViewProps {
    slots: CalendarSlotData[]
    viewObjects: ViewObject[]
    viewId: string
    workspaceId?: string
}

const MiniCalendarView: FC<MiniCalendarViewProps> = ({ slots, viewObjects, viewId, workspaceId }) => {
    // Find the earliest date to determine the default month
    const defaultDate = useMemo(() => {
        if (slots.length === 0) return new Date()

        const dates = slots.map(slot => new Date(slot.date)).sort((a, b) => a.getTime() - b.getTime())
        return dates[0]
    }, [slots])

    const [currentDate, setCurrentDate] = useState(defaultDate)
    const [selectedDay, setSelectedDay] = useState<number | null>(null)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDayOfMonth.getDay()
    const daysInMonth = lastDayOfMonth.getDate()

    const calendarDays: (number | null)[] = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
        calendarDays.push(null)
    }

    // Add all days of the month
    for (let d = 1; d <= daysInMonth; d++) {
        calendarDays.push(d)
    }

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

    // Check if a day has any slots
    const getSlotsForDay = (day: number | null) => {
        if (!day) return []

        return slots.filter(slot => {
            const slotDate = new Date(slot.date)
            return (
                slotDate.getDate() === day &&
                slotDate.getMonth() === month &&
                slotDate.getFullYear() === year
            )
        })
    }

    const previousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
        setSelectedDay(null)
    }

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
        setSelectedDay(null)
    }

    const handleDayClick = (day: number | null) => {
        if (!day) return
        const daySlotsData = getSlotsForDay(day)
        if (daySlotsData.length > 0) {
            setSelectedDay(day)
        }
    }

    const selectedDaySlots = useMemo(() => {
        if (!selectedDay) return []
        const daySlots = getSlotsForDay(selectedDay)
        return daySlots.map((slotData, index) => {
            const slotDate = new Date(slotData.date)
            const viewObject = viewObjects.find(vo => {
                return vo.data === slotData.date
            })
            return { slotData, viewObject }
        })
    }, [selectedDay, slots, viewObjects, year, month])

    return (
        <div
            className=""
            onClick={(e) => e.preventDefault()}
        >
            <div className="flex items-center justify-between py-3">
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        previousMonth()
                    }}
                    className="p-3 rounded bg-white dark:bg-neutral-800"
                    title="Previous month"
                >
                    <ChevronLeft size={14} />
                </button>
                <div className=" font-semibold">
                    {monthNames[month]} {year}
                </div>
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        nextMonth()
                    }}
                    className="p-3 rounded bg-white dark:bg-neutral-800"
                    title="Next month"
                >
                    <ChevronRight size={14} />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
                {weekDays.map((d, i) => (
                    <div key={i} className="flex items-center justify-center  text-gray-500 dark:text-gray-400 aspect-square">
                        {d}
                    </div>
                ))}

                {calendarDays.map((d, index) => {
                    const daySlotsData = getSlotsForDay(d)
                    const isHighlighted = daySlotsData.length > 0
                    const isSelected = d === selectedDay

                    return (
                        <div
                            key={index}
                            onClick={() => handleDayClick(d)}
                            className={`
                                aspect-square flex items-center justify-center  rounded 
                                ${d ? 'text-gray-700 dark:text-gray-300 bg-white dark:bg-neutral-800' : ''}
                                ${isHighlighted ? `font-bold cursor-pointer hover:opacity-80 bg-neutral-300 dark:bg-neutral-600` : ''}
                                ${isSelected ? '' : ''}
                            `}
                        >
                            {d}
                        </div>
                    )
                })}
            </div>

            {/* Selected day info */}
            {selectedDay && selectedDaySlots.length > 0 && (
                <div className="mt-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded ">
                    <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold">
                            {monthNames[month]} {selectedDay}, {year}
                        </div>
                        <button
                            onClick={(e) => {
                                e.preventDefault()
                                setSelectedDay(null)
                            }}
                            aria-label='close'
                            className="p-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                        >
                            <X size={12} />
                        </button>
                    </div>
                    <div className="space-y-1">
                        {selectedDaySlots.map((item, index) => (
                            <Link
                                key={index}
                                to={workspaceId
                                    ? `/workspaces/${workspaceId}/views/${viewId}/objects/${item.viewObject?.id}`
                                    : `/explore/views/${viewId}/objects/${item.viewObject?.id}`
                                }
                                className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 px-2 py-1 rounded transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {item.viewObject?.name || `Slot ${index + 1}`}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default MiniCalendarView