import { useTranslation } from "react-i18next"
import { Calendar, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useState } from "react"

interface ExploreCalendarSlotsListProps {
    slots: any[]
    calendarId: string
    focusedSlotId?: string
}

const ExploreCalendarSlotsList = ({
    slots,
    calendarId,
    focusedSlotId
}: ExploreCalendarSlotsListProps) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState("")

    const handleSlotClick = (slotId: string) => {
        navigate(`/share/calendar/${calendarId}/slot/${slotId}`)
    }

    const filteredSlots = slots.filter((slot) => {
        if (!searchQuery.trim()) return true
        return slot.name.toLowerCase().includes(searchQuery.toLowerCase())
    })

    // Group slots by date
    const groupedSlots = filteredSlots.reduce((acc, slot) => {
        try {
            // Parse slot data - could be JSON or plain date string
            let slotDate: string
            try {
                const parsed = JSON.parse(slot.data)
                slotDate = parsed.date
            } catch {
                // Fallback for old format (just a date string)
                slotDate = slot.data
            }
            const date = new Date(slotDate).toLocaleDateString()
            if (!acc[date]) {
                acc[date] = []
            }
            acc[date].push(slot)
        } catch (e) {
            console.error('Failed to parse slot date:', e)
        }
        return acc
    }, {} as Record<string, any[]>)

    // Sort dates
    const sortedDates = Object.keys(groupedSlots).sort((a, b) =>
        new Date(a).getTime() - new Date(b).getTime()
    )

    return (
        <div className="h-full overflow-y-auto bg-neutral-100 dark:bg-neutral-900">
            <div className="p-4">
                <div className="text-lg font-semibold mb-4">{t('views.calendarSlots')}</div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('views.searchSlots')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {filteredSlots.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {searchQuery.trim() ? t('views.noSlotsFound') : t('views.noSlots')}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedDates.map((date) => (
                            <div key={date}>
                                <div className="text-sm font-medium text-gray-500 mb-2">{date}</div>
                                <div className="space-y-2">
                                    {groupedSlots[date].map((slot: any) => {
                                        const isFocused = slot.id === focusedSlotId

                                        return (
                                            <div
                                                key={slot.id}
                                                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                                                    isFocused
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                                }`}
                                                onClick={() => handleSlotClick(slot.id)}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <Calendar size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium truncate">{slot.name}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ExploreCalendarSlotsList
