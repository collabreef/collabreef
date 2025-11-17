import { useNavigate, useParams, useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPublicViewObject } from "@/api/view"
import PublicViewObjectNotesManager from "@/components/views/PublicViewObjectNotesManager"
import ViewObjectDetailBase from "@/components/views/common/ViewObjectDetailBase"

interface ExploreViewObjectDetailContext {
    view: any
    viewObjects: any[]
    viewId: string
}

const ExploreViewObjectDetailPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { objectId } = useParams<{ objectId: string }>()
    const { viewId, view } = useOutletContext<ExploreViewObjectDetailContext>()

    const { data: viewObject, isLoading } = useQuery({
        queryKey: ['public-view-object', viewId, objectId],
        queryFn: () => getPublicViewObject(viewId!, objectId!),
        enabled: !!viewId && !!objectId,
    })

    const handleBack = () => {
        navigate(`/explore/views/${viewId}`)
    }

    return (
        <ViewObjectDetailBase
            viewName={view.name}
            viewObject={viewObject || null}
            isLoading={isLoading}
            onBack={handleBack}
            notFoundMessage={t('views.objectNotFound')}
        >
            <PublicViewObjectNotesManager
                viewId={viewId!}
                viewObjectId={objectId!}
            />
        </ViewObjectDetailBase>
    )
}

export default ExploreViewObjectDetailPage