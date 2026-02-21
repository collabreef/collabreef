import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPublicViews } from "@/api/view"
import OneColumn from "@/components/onecolumn/OneColumn"
import SidebarButton from "@/components/sidebar/SidebarButton"
import { LoaderCircle } from "lucide-react"
import PublicViewMenu from "@/components/viewmenu/PublicViewMenu"

const ExploreCalendarListPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const { data: views, isLoading } = useQuery({
        queryKey: ['publicviews', 'calendar'],
        queryFn: async () => {
            const allViews = await getPublicViews(1, 100, 'calendar')
            return allViews
        },
    })

    useEffect(() => {
        if (views && views.length > 0) {
            navigate(`/share/calendar/${views[0].id}`, { replace: true })
        }
    }, [views, navigate])

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LoaderCircle className="animate-spin" />
            </div>
        )
    }

    return (
        <OneColumn>
            <div className="w-full">
                <div className="py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 h-10">
                            <SidebarButton />
                            <PublicViewMenu viewType="calendar" />
                        </div>
                    </div>
                    <div className="mt-8 text-center py-8 text-gray-500">
                        <p className="text-lg mb-2">{t('views.noCalendars')}</p>
                    </div>
                </div>
            </div>
        </OneColumn>
    )
}

export default ExploreCalendarListPage
