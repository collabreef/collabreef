import { useState, useMemo } from "react"
import { useNavigate, useParams, useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { CirclePlus, ArrowLeft, Clock } from "lucide-react"
import { getViewObject } from "@/api/view"
import ViewObjectNotesManager from "../ViewObjectNotesManager"
import { CalendarSlotData } from "@/types/view"

interface CalendarSlotDetailContext {
    view: any
    viewObjects: any[]
    workspaceId: string
    viewId: string
}

const CalendarSlotDetail = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { slotId } = useParams<{ slotId: string }>()
    const { workspaceId, viewId, view } = useOutletContext<CalendarSlotDetailContext>()
    const [isAddingNote, setIsAddingNote] = useState(false)

    const { data: slot, isLoading } = useQuery({
        queryKey: ['view-object', workspaceId, viewId, slotId],
        queryFn: () => getViewObject(workspaceId, viewId!, slotId!),
        enabled: !!workspaceId && !!viewId && !!slotId,
    })

    // Parse slot data
    const slotData = useMemo<CalendarSlotData | null>(() => {
        if (!slot || !slot.data) return null
        try {
            return JSON.parse(slot.data)
        } catch {
            // Fallback for old format (just a date string)
            return { date: slot.data, is_all_day: true }
        }
    }, [slot])

    const handleBack = () => {
        navigate(`/workspaces/${workspaceId}/calendar/${viewId}`)
    }

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-gray-500">{t('common.loading')}</div>
            </div>
        )
    }

    if (!slot) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <div className="text-gray-500 mb-4">{t('views.objectNotFound')}</div>
                <button
                    onClick={handleBack}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    {t('common.back')}
                </button>
            </div>
        )
    }

    return (
        <div className="h-full overflow-y-auto bg-neutral-100 dark:bg-neutral-900">
            {!isAddingNote && (
                <div className="p-4 border-b dark:border-neutral-700">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-3"
                    >
                        <ArrowLeft size={16} />
                        {view.name}
                    </button>

                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="text-xl font-semibold">{slot.name}</div>
                            <div className="text-sm text-gray-500 mt-1">
                                {t('views.calendarSlot')}
                            </div>
                            {slotData && (
                                <div className="mt-3 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Clock size={14} />
                                        <span>{new Date(slotData.date).toLocaleDateString()}</span>
                                    </div>
                                    {slotData.is_all_day && (
                                        <div className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                                            {t('views.allDay') || 'All day'}
                                        </div>
                                    )}
                                    {!slotData.is_all_day && slotData.start_time && (
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            {slotData.start_time}
                                            {slotData.end_time && ` - ${slotData.end_time}`}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setIsAddingNote(true)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            title={t('views.addNote')}
                        >
                            <CirclePlus size={20} />
                        </button>
                    </div>
                </div>
            )}

            <ViewObjectNotesManager
                workspaceId={workspaceId}
                viewId={viewId!}
                viewObjectId={slotId!}
                viewObjectName={slot.name}
                isAddingNote={isAddingNote}
                setIsAddingNote={setIsAddingNote}
            />
        </div>
    )
}

export default CalendarSlotDetail
