import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPublicView, getPublicViewObjects } from "@/api/view"
import FlowViewComponent from "@/components/views/flow/FlowViewComponent"
import ViewHeader from "@/components/views/common/ViewHeader"
import PublicViewMenu from "@/components/viewmenu/PublicViewMenu"

const ExploreFlowPage = () => {
    const { t } = useTranslation()
    const { flowId } = useParams<{ flowId: string }>()

    const { data: view, isLoading: isViewLoading } = useQuery({
        queryKey: ['publicView', flowId],
        queryFn: () => getPublicView(flowId!),
        enabled: !!flowId,
    })

    const { data: viewObjects } = useQuery({
        queryKey: ['public-view-objects', flowId],
        queryFn: () => getPublicViewObjects(flowId!),
        enabled: !!flowId,
    })

    if (isViewLoading) {
        return <div className="flex justify-center items-center h-screen">{t('common.loading')}</div>
    }

    if (!view) {
        return <div className="flex justify-center items-center h-screen">{t('views.viewNotFound')}</div>
    }

    return (
        <div className="h-screen flex flex-col">
            <ViewHeader
                menu={<PublicViewMenu viewType="flow" currentViewId={view.id} />}
            />
            <div className="flex-1 overflow-hidden">
                <FlowViewComponent
                    view={view}
                    viewObjects={viewObjects}
                    isPublic={true}
                    viewId={flowId}
                />
            </div>
        </div>
    )
}

export default ExploreFlowPage
