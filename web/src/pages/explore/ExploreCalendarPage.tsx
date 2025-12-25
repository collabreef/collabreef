import { useNavigate, useParams, Outlet } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPublicView, getPublicViewObjects } from "@/api/view"
import { TwoColumn, TwoColumnMain, TwoColumnSidebar } from "@/components/twocolumn"
import CalendarViewComponent from "@/components/views/calendar/CalendarViewComponent"
import ExploreCalendarSlotsList from "@/components/views/calendar/ExploreCalendarSlotsList"
import ViewHeader from "@/components/views/common/ViewHeader"
import { Calendar } from "lucide-react"
import { useTwoColumn } from "@/components/twocolumn"
import PublicViewMenu from "@/components/viewmenu/PublicViewMenu"

const ExploreCalendarPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { calendarId, slotId } = useParams<{ calendarId: string; slotId?: string }>()

    const { data: view, isLoading: isViewLoading } = useQuery({
        queryKey: ['publicView', calendarId],
        queryFn: () => getPublicView(calendarId!),
        enabled: !!calendarId,
    })

    const { data: viewObjects } = useQuery({
        queryKey: ['public-view-objects', calendarId],
        queryFn: () => getPublicViewObjects(calendarId!),
        enabled: !!calendarId,
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
                <PublicCalendarContent view={view} viewObjects={viewObjects} navigate={navigate} focusedObjectId={slotId} />
            </TwoColumnMain>

            <TwoColumnSidebar className="bg-white">
                {slotId ? (
                    <Outlet context={{
                        view,
                        viewObjects: viewObjects || [],
                        viewId: calendarId
                    }} />
                ) : (
                    <ExploreCalendarSlotsList
                        slots={viewObjects || []}
                        calendarId={calendarId!}
                        focusedSlotId={slotId}
                    />
                )}
            </TwoColumnSidebar>
        </TwoColumn>
    )
}

const PublicCalendarContent = ({ view, viewObjects, focusedObjectId }: any) => {
    const { isSidebarCollapsed, toggleSidebar } = useTwoColumn()

    return (
        <div className="w-full">
            <ViewHeader
                menu={<PublicViewMenu viewType="calendar" currentViewId={view.id} />}
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

export default ExploreCalendarPage
