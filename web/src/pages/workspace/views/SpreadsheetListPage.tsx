import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getViews } from "@/api/view"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import OneColumn from "@/components/onecolumn/OneColumn"
import SidebarButton from "@/components/sidebar/SidebarButton"
import { LoaderCircle } from "lucide-react"
import ViewMenu from "@/components/viewmenu/ViewMenu"

const SpreadsheetListPage = () => {
    const { t } = useTranslation()
    const currentWorkspaceId = useCurrentWorkspaceId()
    const navigate = useNavigate()

    const { data: views, isLoading } = useQuery({
        queryKey: ['views', currentWorkspaceId, 'spreadsheet'],
        queryFn: async () => {
            const allViews = await getViews(currentWorkspaceId)
            return allViews.filter((v: any) => v.type === 'spreadsheet')
        },
        enabled: !!currentWorkspaceId,
    })

    useEffect(() => {
        if (views && views.length > 0) {
            navigate(`/workspaces/${currentWorkspaceId}/spreadsheet/${views[0].id}`, { replace: true })
        }
    }, [views, navigate, currentWorkspaceId])

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
                            <ViewMenu viewType="spreadsheet" />
                        </div>
                    </div>
                    {!views || views.length === 0 ? (
                        <div className="mt-8 text-center py-8 text-gray-500">
                            <p className="text-lg mb-2">{t('views.noSpreadsheets') || 'No spreadsheets yet'}</p>
                            <p className="text-sm">{t('views.createFirstSpreadsheet') || 'Create your first spreadsheet to get started'}</p>
                        </div>
                    ) : null}
                </div>
            </div>
        </OneColumn>
    )
}

export default SpreadsheetListPage
