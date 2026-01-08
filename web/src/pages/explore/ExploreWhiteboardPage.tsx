import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPublicView } from "@/api/view"
import WhiteboardViewComponent from "@/components/views/whiteboard/WhiteboardViewComponent"
import ViewHeader from "@/components/views/common/ViewHeader"
import PublicViewMenu from "@/components/viewmenu/PublicViewMenu"

const ExploreWhiteboardPage = () => {
    const { t } = useTranslation()
    const { whiteboardId } = useParams<{ whiteboardId: string }>()

    const { data: view, isLoading: isViewLoading } = useQuery({
        queryKey: ['public-view', whiteboardId],
        queryFn: () => getPublicView(whiteboardId!),
        enabled: !!whiteboardId,
    })

    if (isViewLoading) {
        return <div className="flex justify-center items-center h-screen">{t('common.loading')}</div>
    }

    if (!view) {
        return <div className="flex justify-center items-center h-screen">{t('views.viewNotFound')}</div>
    }

    return (
        <div className="flex flex-col h-dvh bg-neutral-50 dark:bg-neutral-950">
            <ViewHeader
                menu={<PublicViewMenu viewType="whiteboard" currentViewId={view.id} />}
            />
            <div className="flex-1 overflow-hidden border shadow">
                <WhiteboardViewComponent
                    view={view}
                    isPublic
                    viewId={whiteboardId}
                />
            </div>
        </div>
    )
}

export default ExploreWhiteboardPage
