import { useNavigate, useParams, useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Calendar, MapPin, ChevronDown } from "lucide-react"
import { getViewObject } from "@/api/view"
import ViewObjectNotesManager from "@/components/views/ViewObjectNotesManager"
import { useTwoColumn } from "@/components/twocolumn"

interface ViewObjectDetailContext {
    view: any
    workspaceId: string
    viewId: string
}

const ViewObjectDetailPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { objectId } = useParams<{ objectId: string }>()
    const { toggleSidebar } = useTwoColumn()
    const { view, workspaceId, viewId } = useOutletContext<ViewObjectDetailContext>()

    const { data: viewObject, isLoading } = useQuery({
        queryKey: ['view-object', workspaceId, viewId, objectId],
        queryFn: () => getViewObject(workspaceId, viewId!, objectId!),
        enabled: !!workspaceId && !!viewId && !!objectId,
    })

    const handleBack = () => {
        navigate(`/workspaces/${workspaceId}/views/${viewId}`)
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                {t('common.loading')}
            </div>
        )
    }

    if (!viewObject) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t('views.objectNotFound')}
                </p>
                <button
                    onClick={handleBack}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    {t('common.back')}
                </button>
            </div>
        )
    }

    const getIcon = () => {
        if (viewObject.type === 'calendar_slot') return <Calendar size={20} />
        if (viewObject.type === 'map_marker') return <MapPin size={20} />
        return null
    }

    return (
        <div className="w-full bg-gray-50 dark:bg-neutral-900">
            {/* Header */}
            <div className="sticky top-0 bg-gray-50 dark:bg-neutral-900 border-b dark:border-neutral-700 px-4 py-4 z-10">
                <div className="flex items-center justify-between mb-3">
                    <button
                        aria-label="back"
                        onClick={handleBack}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
                        title={t('views.hideSidebar')}
                    >
                        <ChevronDown size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    {getIcon()}
                    <div className="text-lg font-bold truncate">{viewObject.name}</div>
                </div>
            </div>

            {/* Content */}
            <div className="p-2 space-y-4 overflow-x-hidden">
                {/* View Object Data */}
                {viewObject.data && (
                    <div className="">
                        <div className="">
                            {(() => {
                                // For map markers, parse and display coordinates
                                if (viewObject.type === 'map_marker') {
                                    try {
                                        const coords = JSON.parse(viewObject.data)
                                        if (coords.lat && coords.lng) {
                                            return (
                                                <div className="flex items-center gap-2 ">
                                                    <MapPin size={14} className="flex-shrink-0 text-blue-500" />
                                                    <span className="font-mono">
                                                        {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                                                    </span>
                                                </div>
                                            )
                                        }
                                    } catch (e) {
                                        return (
                                            <pre className="bg-gray-50 dark:bg-neutral-700 p-2 rounded overflow-x-auto text-xs">
                                                {viewObject.data}
                                            </pre>
                                        )
                                    }
                                }
                                // For calendar slots, show the date
                                if (viewObject.type === 'calendar_slot') {
                                    return (
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="flex-shrink-0 text-blue-500" />
                                            <span className="font-medium ">{viewObject.data}</span>
                                        </div>
                                    )
                                }
                                // Default: show raw data
                                return (
                                    <pre className="">
                                        {viewObject.data}
                                    </pre>
                                )
                            })()}
                        </div>
                    </div>
                )}

                {/* Linked Notes */}
                <div className="">
                    <ViewObjectNotesManager
                        workspaceId={workspaceId}
                        viewId={viewId!}
                        viewObjectId={objectId!}
                        viewObjectName={viewObject.name}
                    />
                </div>
            </div>
        </div>
    )
}

export default ViewObjectDetailPage