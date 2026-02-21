import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPublicView } from "@/api/view"
import SpreadsheetViewComponent from "@/components/views/spreadsheet/SpreadsheetViewComponent"
import ViewHeader from "@/components/views/common/ViewHeader"
import PublicViewMenu from "@/components/viewmenu/PublicViewMenu"
import OneColumn from "@/components/onecolumn/OneColumn"
import { useMemo } from "react"
import { SpreadsheetSheetData } from "@/types/view"

const ExploreSpreadsheetPage = () => {
    const { t } = useTranslation()
    const { spreadsheetId } = useParams<{ spreadsheetId: string }>()

    const { data: view, isLoading: isViewLoading } = useQuery({
        queryKey: ['public-view', spreadsheetId],
        queryFn: () => getPublicView(spreadsheetId!),
        enabled: !!spreadsheetId,
    })

    // Parse sheets from view.data
    const initialSheets = useMemo((): SpreadsheetSheetData[] => {
        if (!view?.data) return []
        try {
            const parsed = JSON.parse(view.data)
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed
            }
        } catch (e) {
            console.error('Failed to parse sheets:', e)
        }
        return []
    }, [view?.data])

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
                    menu={<PublicViewMenu viewType="spreadsheet" currentViewId={view.id} />}
                />
                <div className="flex-1 overflow-hidden">
                    <SpreadsheetViewComponent
                        view={view}
                        isPublic
                        viewId={spreadsheetId}
                        initialSheets={initialSheets}
                        disableWebSocket={true}
                    />
                </div>
            </div>
        </OneColumn>
    )
}

export default ExploreSpreadsheetPage
