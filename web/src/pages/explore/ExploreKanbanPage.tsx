import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPublicView, getPublicViewObjects } from "@/api/view"
import KanbanViewComponent from "@/components/views/kanban/KanbanViewComponent"
import ViewHeader from "@/components/views/common/ViewHeader"

const ExploreKanbanPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { kanbanId } = useParams<{ kanbanId: string }>()

    const { data: view, isLoading: isViewLoading } = useQuery({
        queryKey: ['publicView', kanbanId],
        queryFn: () => getPublicView(kanbanId!),
        enabled: !!kanbanId,
    })

    const { data: viewObjects } = useQuery({
        queryKey: ['public-view-objects', kanbanId],
        queryFn: () => getPublicViewObjects(kanbanId!),
        enabled: !!kanbanId,
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
                viewName={view.name}
                onBack={() => navigate('/explore/views')}
            />
            <div className="flex-1 overflow-hidden">
                <KanbanViewComponent
                    viewObjects={viewObjects}
                    isPublic={true}
                    viewId={kanbanId}
                />
            </div>
        </div>
    )
}

export default ExploreKanbanPage
