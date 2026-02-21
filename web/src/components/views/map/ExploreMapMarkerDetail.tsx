import { useNavigate, useParams, useOutletContext } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { getPublicViewObject } from "@/api/view"
import PublicViewObjectNotesManager from "../PublicViewObjectNotesManager"

interface ExploreMapMarkerDetailContext {
    view: any
    viewObjects: any[]
    viewId: string
}

const ExploreMapMarkerDetail = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { markerId } = useParams<{ markerId: string }>()
    const { viewId, view } = useOutletContext<ExploreMapMarkerDetailContext>()

    const { data: marker, isLoading } = useQuery({
        queryKey: ['public-view-object', viewId, markerId],
        queryFn: () => getPublicViewObject(viewId!, markerId!),
        enabled: !!viewId && !!markerId,
    })

    const handleBack = () => {
        navigate(`/share/map/${viewId}`)
    }

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-gray-500">{t('common.loading')}</div>
            </div>
        )
    }

    if (!marker) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <div className="text-gray-500 mb-4">{t('views.objectNotFound')}</div>
                <button
                    onClick={handleBack}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    {t('common.back')}
                </button>
            </div>
        )
    }

    let markerData: any = {}
    try {
        markerData = JSON.parse(marker.data)
    } catch (e) {
        console.error('Failed to parse marker data:', e)
    }

    return (
        <div className="h-full overflow-y-auto bg-neutral-100 dark:bg-neutral-900">
            <div className="p-4 border-b dark:border-neutral-700">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-3"
                >
                    <ArrowLeft size={16} />
                    {view.name}
                </button>

                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="text-xl font-semibold">{marker.name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                            {t('views.mapMarker')}
                        </div>
                        {markerData.lat && markerData.lng && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                <div>Lat: {markerData.lat.toFixed(4)}</div>
                                <div>Lng: {markerData.lng.toFixed(4)}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <PublicViewObjectNotesManager
                viewId={viewId!}
                viewObjectId={markerId!}
            />
        </div>
    )
}

export default ExploreMapMarkerDetail
