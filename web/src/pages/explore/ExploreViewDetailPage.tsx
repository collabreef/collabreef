import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Calendar, MapPin, ArrowLeft } from "lucide-react"
import { getPublicView, getPublicViewObjects } from "@/api/view"
import { ViewObject } from "@/types/view"
import OneColumn from "@/components/onecolumn/OneColumn"
import TransitionWrapper from "@/components/transitionwrapper/TransitionWrapper"

const ExploreViewDetailPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { viewId } = useParams<{ viewId: string }>()

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
        return (
            <OneColumn>
                <div className="flex justify-center items-center h-screen">
                    {t('common.loading')}
                </div>
            </OneColumn>
        )
    }

    if (!view) {
        return (
            <OneColumn>
                <div className="flex justify-center items-center h-screen">
                    {t('views.viewNotFound')}
                </div>
            </OneColumn>
        )
    }

    return (
        <OneColumn>
            <TransitionWrapper className="w-full">
                <div className="py-2 mb-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/explore/views')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            {view.type === 'calendar' ? (
                                <Calendar size={20} className="text-orange-500" />
                            ) : (
                                <MapPin size={20} className="text-orange-500" />
                            )}
                            <h1 className="text-2xl font-bold">{view.name}</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400 ml-11">
                        <span>{t(`views.${view.type}`)}</span>
                        <span>•</span>
                        <span>{t('views.createdBy')}: {view.created_by}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    {viewObjects && viewObjects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {viewObjects.map((obj: ViewObject) => (
                                <div
                                    key={obj.id}
                                    className="bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-700 p-4"
                                >
                                    <div className="font-semibold mb-2">{obj.name}</div>
                                    {obj.data && (
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {(() => {
                                                // For map markers, parse and display coordinates
                                                if (obj.type === 'map_marker') {
                                                    try {
                                                        const coords = JSON.parse(obj.data)
                                                        if (coords.lat && coords.lng) {
                                                            return (
                                                                <div className="flex items-center gap-1">
                                                                    <MapPin size={12} className="flex-shrink-0" />
                                                                    <span className="text-xs">
                                                                        {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                                                                    </span>
                                                                </div>
                                                            )
                                                        }
                                                    } catch (e) {
                                                        return <p className="whitespace-pre-wrap text-xs">{obj.data}</p>
                                                    }
                                                }
                                                // For calendar slots, show the date
                                                if (obj.type === 'calendar_slot') {
                                                    return (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar size={12} className="flex-shrink-0" />
                                                            <span className="text-xs">{obj.data}</span>
                                                        </div>
                                                    )
                                                }
                                                return <p className="whitespace-pre-wrap text-xs">{obj.data}</p>
                                            })()}
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400 mt-2">
                                        {t('views.createdBy')}: {obj.created_by}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            {view.type === 'calendar' ? <Calendar size={48} className="mx-auto mb-4" /> : <MapPin size={48} className="mx-auto mb-4" />}
                            <p className="text-sm">
                                {view.type === 'calendar' ? t('views.noSlots') : t('views.noMarkers')}
                            </p>
                        </div>
                    )}
                </div>
            </TransitionWrapper>
        </OneColumn>
    )
}

export default ExploreViewDetailPage