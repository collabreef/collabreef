import { useNavigate, useOutletContext } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useTwoColumn } from "@/components/twocolumn"
import ViewObjectsListBase from "@/components/views/common/ViewObjectsListBase"

interface ViewObjectsListContext {
    view: any
    viewObjects: any[]
    handleDelete: (objectId: string) => void
    deleteMutation: any
    workspaceId: string
    viewId: string
    setIsCreating: (value: boolean) => void
}

const ViewObjectsList = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { isSidebarCollapsed, toggleSidebar } = useTwoColumn()
    const { view, viewObjects, handleDelete, deleteMutation, workspaceId, viewId, setIsCreating } =
        useOutletContext<ViewObjectsListContext>()

    const handleObjectClick = (objectId: string) => {
        if (isSidebarCollapsed) {
            toggleSidebar()
        }
        navigate(`/workspaces/${workspaceId}/views/${viewId}/objects/${objectId}`)
    }

    const getEmptyMessage = () => {
        if (view.type === 'calendar') return t('views.noSlots')
        if (view.type === 'map') return t('views.noMarkers')
        return 'No objects yet'
    }

    const getEmptyHint = () => {
        if (view.type === 'calendar') return t('views.createSlot')
        if (view.type === 'map') return t('views.createMarker')
        return 'Create your first one to get started'
    }

    const getCreateButtonTitle = () => {
        if (view.type === 'calendar') return t('views.createSlot')
        if (view.type === 'map') return t('views.createMarker')
        return 'Create'
    }

    return (
        <ViewObjectsListBase
            viewObjects={viewObjects}
            onObjectClick={handleObjectClick}
            onDelete={handleDelete}
            isDeleting={deleteMutation.isPending}
            showDelete={true}
            emptyMessage={getEmptyMessage()}
            emptyHint={getEmptyHint()}
            showCreateButton={true}
            onCreateClick={() => setIsCreating(true)}
            createButtonTitle={getCreateButtonTitle()}
        />
    )
}

export default ViewObjectsList