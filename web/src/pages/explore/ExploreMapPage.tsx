import { useNavigate, useParams, Outlet } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPublicView, getPublicViewObjects } from "@/api/view"
import { TwoColumn, TwoColumnMain, TwoColumnSidebar } from "@/components/twocolumn"
import MapViewComponent from "@/components/views/map/MapViewComponent"
import ExploreMapMarkersList from "@/components/views/map/ExploreMapMarkersList"
import ViewHeader from "@/components/views/common/ViewHeader"
import { MapPin } from "lucide-react"
import { useTwoColumn } from "@/components/twocolumn"

const ExploreMapPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { mapId, markerId } = useParams<{ mapId: string; markerId?: string }>()

    const { data: view, isLoading: isViewLoading } = useQuery({
        queryKey: ['publicView', mapId],
        queryFn: () => getPublicView(mapId!),
        enabled: !!mapId,
    })

    const { data: viewObjects } = useQuery({
        queryKey: ['public-view-objects', mapId],
        queryFn: () => getPublicViewObjects(mapId!),
        enabled: !!mapId,
    })

    if (isViewLoading) {
        return <div className="flex justify-center items-center h-screen">{t('common.loading')}</div>
    }

    if (!view) {
        return <div className="flex justify-center items-center h-screen">{t('views.viewNotFound')}</div>
    }

    return (
        <TwoColumn>
            <TwoColumnMain>
                <PublicMapContent view={view} viewObjects={viewObjects} navigate={navigate} focusedObjectId={markerId} />
            </TwoColumnMain>

            <TwoColumnSidebar className="bg-white">
                {markerId ? (
                    <Outlet context={{
                        view,
                        viewObjects: viewObjects || [],
                        viewId: mapId
                    }} />
                ) : (
                    <ExploreMapMarkersList
                        markers={viewObjects || []}
                        mapId={mapId!}
                        focusedMarkerId={markerId}
                    />
                )}
            </TwoColumnSidebar>
        </TwoColumn>
    )
}

const PublicMapContent = ({ view, viewObjects, navigate, focusedObjectId }: any) => {
    const { isSidebarCollapsed, toggleSidebar } = useTwoColumn()

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-shrink-0">
                <ViewHeader
                    viewName={view.name}
                    onBack={() => navigate('/explore/views')}
                    rightActions={
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
                        >
                            <MapPin size={18} />
                        </button>
                    }
                />
            </div>

            <div className="flex-1 overflow-hidden">
                <MapViewComponent viewObjects={viewObjects} view={view} focusedObjectId={focusedObjectId} isPublic={true} />
            </div>
        </div>
    )
}

export default ExploreMapPage
