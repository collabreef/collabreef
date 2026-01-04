import { useParams, Outlet } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPublicView, getPublicViewObjects } from "@/api/view"
import { TwoColumn, TwoColumnMain, TwoColumnSidebar } from "@/components/twocolumn"
import ExploreCalendarViewContent from "@/components/views/calendar/ExploreCalendarViewContent"
import ExploreCalendarSlotsList from "@/components/views/calendar/ExploreCalendarSlotsList"

const ExploreCalendarPage = () => {
    const { t } = useTranslation()
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
                <ExploreCalendarViewContent
                    view={view}
                    viewObjects={viewObjects || []}
                    focusedObjectId={slotId}
                />
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

export default ExploreCalendarPage
