import { useNavigate, useOutletContext } from "react-router-dom"
import { useTranslation } from "react-i18next"
import ViewObjectsListBase from "@/components/views/common/ViewObjectsListBase"

interface ExploreViewObjectsListContext {
    view: any
    viewObjects: any[]
    viewId: string
}

const ExploreViewObjectsList = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { view, viewObjects, viewId } = useOutletContext<ExploreViewObjectsListContext>()

    const getEmptyMessage = () => {
        if (view.type === 'calendar') return t('views.noSlots')
        if (view.type === 'map') return t('views.noMarkers')
        return 'No objects yet'
    }

    const handleObjectClick = (objectId: string) => {
        navigate(`/explore/views/${viewId}/objects/${objectId}`)
    }

    return (
        <ViewObjectsListBase
            viewObjects={viewObjects}
            onObjectClick={handleObjectClick}
            emptyMessage={getEmptyMessage()}
            showDelete={false}
            showCreateButton={false}
        />
    )
}

export default ExploreViewObjectsList
