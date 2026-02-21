import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getView } from "@/api/view"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import SpreadsheetViewComponent from "@/components/views/spreadsheet/SpreadsheetViewComponent"
import ViewHeader from "@/components/views/common/ViewHeader"
import ViewMenu from "@/components/viewmenu/ViewMenu"
import OneColumn from "@/components/onecolumn/OneColumn"

const SpreadsheetPage = () => {
    const { t } = useTranslation()
    const { spreadsheetId } = useParams<{ spreadsheetId: string }>()
    const currentWorkspaceId = useCurrentWorkspaceId()

    const { data: view, isLoading: isViewLoading } = useQuery({
        queryKey: ['view', currentWorkspaceId, spreadsheetId],
        queryFn: () => getView(currentWorkspaceId, spreadsheetId!),
        enabled: !!currentWorkspaceId && !!spreadsheetId,
    })

    if (isViewLoading) {
        return <div className="flex justify-center items-center h-screen">{t('common.loading')}</div>
    }

    if (!view) {
        return <div className="flex justify-center items-center h-screen">{t('views.viewNotFound')}</div>
    }

    return (
        <OneColumn>
            <div className="flex flex-col h-screen">
                <ViewHeader
                    menu={<ViewMenu viewType="spreadsheet" currentViewId={view.id} />}
                />
                <div className="flex-1 overflow-hidden">
                    <SpreadsheetViewComponent
                        view={view}
                        workspaceId={currentWorkspaceId}
                        viewId={spreadsheetId}
                    />
                </div>
            </div>
        </OneColumn>
    )
}

export default SpreadsheetPage
