import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPublicView, getPublicViewObjects } from "@/api/view"
import WhiteboardViewComponent from "@/components/views/whiteboard/WhiteboardViewComponent"
import ViewHeader from "@/components/views/common/ViewHeader"
import PublicViewMenu from "@/components/viewmenu/PublicViewMenu"
import OneColumn from "@/components/onecolumn/OneColumn"
import { useMemo } from "react"

const ExploreWhiteboardPage = () => {
    const { t } = useTranslation()
    const { whiteboardId } = useParams<{ whiteboardId: string }>()

    const { data: view, isLoading: isViewLoading } = useQuery({
        queryKey: ['public-view', whiteboardId],
        queryFn: () => getPublicView(whiteboardId!),
        enabled: !!whiteboardId,
    })

    const { data: viewObjects, isLoading: isViewObjectsLoading } = useQuery({
        queryKey: ['public-view-objects', whiteboardId],
        queryFn: () => getPublicViewObjects(whiteboardId!, 1, 1000),
        enabled: !!whiteboardId,
    })

    // Parse canvas objects from view.data
    const canvasObjects = useMemo(() => {
        if (!view?.data) return {}
        try {
            return JSON.parse(view.data)
        } catch (e) {
            console.error('Failed to parse canvas objects:', e)
            return {}
        }
    }, [view?.data])

    // Convert view objects array to map
    const viewObjectsMap = useMemo(() => {
        if (!viewObjects) return {}
        const map: Record<string, any> = {}
        viewObjects.forEach((obj: any) => {
            // Parse data if it's a string
            let parsedData = obj.data
            if (typeof obj.data === 'string') {
                try {
                    parsedData = JSON.parse(obj.data)
                } catch (e) {
                    console.error('Failed to parse view object data:', e)
                }
            }
            map[obj.id] = {
                id: obj.id,
                type: obj.type,
                name: obj.name,
                data: parsedData
            }
        })
        return map
    }, [viewObjects])

    if (isViewLoading || isViewObjectsLoading) {
        return <div className="flex justify-center items-center h-screen">{t('common.loading')}</div>
    }

    if (!view) {
        return <div className="flex justify-center items-center h-screen">{t('views.viewNotFound')}</div>
    }

    return (
        <OneColumn>
            <div className="flex flex-col h-screen">
                <ViewHeader
                    menu={<PublicViewMenu viewType="whiteboard" currentViewId={view.id} />}
                />
                <div className="flex-1 overflow-hidden">
                    <WhiteboardViewComponent
                        view={view}
                        isPublic
                        viewId={whiteboardId}
                        initialCanvasObjects={canvasObjects}
                        initialViewObjects={viewObjectsMap}
                        disableWebSocket={true}
                    />
                </div>
            </div>
        </OneColumn>
    )
}

export default ExploreWhiteboardPage
