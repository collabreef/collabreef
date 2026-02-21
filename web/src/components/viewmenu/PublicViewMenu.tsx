import { ChevronsUpDown } from "lucide-react"
import { Dropdown } from "../dropdown/Dropdown"
import { useMemo, useState } from "react"
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ViewType } from "@/types/view"
import { getPublicViews } from "@/api/view"
import { useQuery } from "@tanstack/react-query"

interface PublicViewMenuProps {
    viewType: ViewType
    currentViewId?: string
}

const PublicViewMenu = ({ viewType, currentViewId }: PublicViewMenuProps) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [keyword, setKeyword] = useState("")

    const { data: views } = useQuery({
        queryKey: ['publicviews', viewType],
        queryFn: async () => {
            const allViews = await getPublicViews(1, 100, viewType)
            return allViews
        },
    })

    const currentView = useMemo(() => {
        return views?.find((v: any) => v.id === currentViewId)
    }, [views, currentViewId])

    const filteredViews = useMemo(() => {
        if (!views) return []
        return keyword
            ? views.filter((v: any) => v.name.toLowerCase().includes(keyword.toLowerCase()))
            : views
    }, [views, keyword])

    const handleViewClick = (id: string) => {
        if (id === currentViewId) return
        navigate(`/share/${viewType}/${id}`)
    }

    const getViewTypeLabel = () => {
        switch (viewType) {
            case 'calendar':
                return t('views.calendar')
            case 'map':
                return t('views.map')
            case 'kanban':
                return t('views.kanban') || 'Kanban'
            case 'whiteboard':
                return t('views.whiteboard') || 'Whiteboard'
            case 'spreadsheet':
                return t('views.spreadsheet') || 'Spreadsheet'
            default:
                return viewType
        }
    }

    const getSearchPlaceholder = () => {
        switch (viewType) {
            case 'calendar':
                return t('views.searchCalendarOnly')
            case 'map':
                return t('views.searchMapOnly')
            case 'kanban':
                return t('views.searchKanbanOnly')
            case 'whiteboard':
                return t('views.searchWhiteboardOnly') || 'Search Whiteboard'
            case 'spreadsheet':
                return t('views.searchSpreadsheetOnly') || 'Search Spreadsheet'
            default:
                return t('placeholder.searchWorkspace')
        }
    }

    return (
        <Dropdown
            className="w-full"
            buttonClassName="bg-white dark:bg-neutral-700 shadow border dark:border-none w-full px-3 py-1.5 rounded-md text-sm flex justify-center items-center truncate"
            buttonTooltip={currentView?.name ?? getViewTypeLabel()}
            buttonContent={
                <>
                    <span className="grow text-left truncate">
                        {currentView?.name ?? getViewTypeLabel()}
                    </span>
                    <span className="w-5">
                        <ChevronsUpDown size={16} />
                    </span>
                </>
            }
        >
            <div className="px-2 pb-2">
                <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="border dark:border-none shadow-inner rounded-md w-full px-3 py-1 dark:bg-neutral-700 dark:text-neutral-100"
                    placeholder={getSearchPlaceholder()}
                />
            </div>
            <div className="overflow-y-auto pb-2 max-h-64">
                {filteredViews.length === 0 && keyword.length > 0 && (
                    <div className="px-2 py-4 text-center text-sm text-gray-500">
                        {t('common.noResults')}
                    </div>
                )}
                {filteredViews.length === 0 && keyword.length === 0 && (
                    <div className="px-2 py-4 text-center text-sm text-gray-500">
                        {t('views.noViews')}
                    </div>
                )}
                {filteredViews.map((v: any) => (
                    <div key={v.id} className="px-2 text-sm text-ellipsis">
                        <button
                            className="px-3 py-2 rounded w-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-left truncate"
                            onClick={() => handleViewClick(v.id)}
                        >
                            {v.name}
                        </button>
                    </div>
                ))}
            </div>
        </Dropdown>
    )
}

export default PublicViewMenu
