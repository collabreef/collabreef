import { useEffect } from "react"
import { Outlet, useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Calendar, MapPin, ChevronUp } from "lucide-react"
import { getPublicView, getPublicViewObjects } from "@/api/view"
import { TwoColumn, TwoColumnMain, TwoColumnSidebar, useTwoColumn } from "@/components/twocolumn"
import CalendarViewComponent from "@/components/views/calendar/CalendarViewComponent"
import MapViewComponent from "@/components/views/map/MapViewComponent"
import ViewHeader from "@/components/views/common/ViewHeader"

const ExploreViewDetailPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { viewId, objectId } = useParams<{ viewId: string; objectId?: string }>()

    const { data: view, isLoading: isViewLoading } = useQuery({
        queryKey: ['publicView', viewId],
        queryFn: () => getPublicView(viewId!),
        enabled: !!viewId,
    })

    const { data: viewObjects } = useQuery({
        queryKey: ['public-view-objects', viewId],
        queryFn: () => getPublicViewObjects(viewId!),
        enabled: !!viewId,
    })

    if (isViewLoading) {
        return <div className="flex justify-center items-center h-screen">{t('common.loading')}</div>
    }

    if (!view) {
        return <div className="flex justify-center items-center h-screen">{t('views.viewNotFound')}</div>
    }

    return (
        <TwoColumn>
            <ExploreViewContent
                view={view}
                viewObjects={viewObjects}
                navigate={navigate}
                objectId={objectId}
                viewId={viewId}
                t={t}
            />
        </TwoColumn>
    )
}

const ExploreViewContent = ({ view, viewObjects, navigate, objectId, viewId, t }: any) => {
    const { isSidebarCollapsed, toggleSidebar } = useTwoColumn()

    // Auto-open sidebar when navigating to object detail page
    useEffect(() => {
        if (objectId && isSidebarCollapsed) {
            toggleSidebar()
        }
    }, [objectId])

    return (
        <>
            <TwoColumnMain className=" relative">
                <PublicViewContent
                    view={view}
                    viewObjects={viewObjects}
                    navigate={navigate}
                    focusedObjectId={objectId}
                />

                {/* Floating button to open bottom sheet on mobile - only show on mobile when sidebar is collapsed */}
                {isSidebarCollapsed && (
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden fixed bottom-6 right-6 z-30 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg transition-all duration-200 active:scale-95"
                        title={t('views.showSidebar')}
                    >
                        <ChevronUp size={24} />
                    </button>
                )}
            </TwoColumnMain>

            <TwoColumnSidebar className="bg-white">
                <Outlet context={{
                    view,
                    viewObjects,
                    viewId: viewId!
                }} />
            </TwoColumnSidebar>
        </>
    )
}

// Main content component - renders different views based on type (read-only for public)
const PublicViewContent = ({ view, viewObjects, navigate, focusedObjectId }: any) => {
    const { isSidebarCollapsed, toggleSidebar } = useTwoColumn()

    if (view.type === 'calendar') {
        return (
            <div className="w-full">
                <ViewHeader
                    viewName={view.name}
                    onBack={() => navigate('/explore/views')}
                    rightActions={
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
                        >
                            <Calendar size={18} />
                        </button>
                    }
                />

                <CalendarViewComponent
                    key={focusedObjectId || 'default'}
                    viewObjects={viewObjects}
                    focusedObjectId={focusedObjectId}
                    isPublic={true}
                />
            </div>
        )
    }

    if (view.type === 'map') {
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

    return null
}

export default ExploreViewDetailPage