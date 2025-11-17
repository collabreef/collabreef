import { useNavigate, useParams, useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
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

    const { data: viewObject, isLoading } = useQuery({
        queryKey: ['view-object', workspaceId, viewId, objectId],
        queryFn: () => getViewObject(workspaceId, viewId!, objectId!),
        enabled: !!workspaceId && !!viewId && !!objectId,
    })

    const handleBack = () => {
        navigate(`/workspaces/${workspaceId}/views/${viewId}`)
    }

    return (
        <ViewObjectDetailBase
            viewName={view.name}
            viewObject={viewObject || null}
            isLoading={isLoading}
            onBack={handleBack}
            notFoundMessage={t('views.objectNotFound')}
        >
            <ViewObjectNotesManager
                workspaceId={workspaceId}
                viewId={viewId!}
                viewObjectId={objectId!}
                viewObjectName={viewObject?.name || ''}
            />
        </ViewObjectDetailBase>
    )
}

export default ViewObjectDetailPage