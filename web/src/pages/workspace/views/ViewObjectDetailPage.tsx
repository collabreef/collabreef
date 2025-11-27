import { useState } from "react"
import { useNavigate, useParams, useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { SquarePlus } from "lucide-react"
import { getViewObject } from "@/api/view"
import ViewObjectNotesManager from "@/components/views/ViewObjectNotesManager"
import ViewObjectDetailBase from "@/components/views/common/ViewObjectDetailBase"

interface ViewObjectDetailContext {
    view: any
    viewObjects: any[]
    workspaceId: string
    viewId: string
}

const ViewObjectDetailPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { objectId } = useParams<{ objectId: string }>()
    const { workspaceId, viewId, view } = useOutletContext<ViewObjectDetailContext>()
    const [isAddingNote, setIsAddingNote] = useState(false)

    const { data: viewObject, isLoading } = useQuery({
        queryKey: ['view-object', workspaceId, viewId, objectId],
        queryFn: () => getViewObject(workspaceId, viewId!, objectId!),
        enabled: !!workspaceId && !!viewId && !!objectId,
    })

    const handleBack = () => {
        navigate(`/workspaces/${workspaceId}/views/${viewId}`)
    }

    const addNoteButton = (
        <button
            onClick={() => setIsAddingNote(true)}
            className="p-2"
            title={t('views.addNote')}
        >
            <SquarePlus className="stroke-[1]" />
        </button>
    )

    return (
        <ViewObjectDetailBase
            viewName={view.name}
            viewObject={viewObject || null}
            isLoading={isLoading}
            onBack={handleBack}
            notFoundMessage={t('views.objectNotFound')}
            headerAction={addNoteButton}
        >
            <ViewObjectNotesManager
                workspaceId={workspaceId}
                viewId={viewId!}
                viewObjectId={objectId!}
                viewObjectName={viewObject?.name || ''}
                isAddingNote={isAddingNote}
                setIsAddingNote={setIsAddingNote}
            />
        </ViewObjectDetailBase>
    )
}

export default ViewObjectDetailPage