import { useState } from "react"
import { useNavigate, useParams, useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { CirclePlus, ArrowLeft } from "lucide-react"
import { getViewObject } from "@/api/view"
import ViewObjectNotesManager from "../ViewObjectNotesManager"

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
                        <h2 className="text-xl font-semibold">{slot.name}</h2>
                        <div className="text-sm text-gray-500 mt-1">
                            {t('views.calendarSlot')}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {new Date(slot.data).toLocaleDateString()}
                        </div>
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
