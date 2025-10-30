import { useState } from "react"
import { Outlet, useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { getView, getViewObjects, createViewObject, deleteViewObject } from "@/api/view"
import { useToastStore } from "@/stores/toast"
import { TwoColumn, TwoColumnMain, TwoColumnSidebar } from "@/components/twocolumn"
import { ViewObjectType } from "@/types/view"
import CalendarViewContent from "@/components/views/calendar/CalendarViewContent"
import MapViewContent from "@/components/views/map/MapViewContent"

const ViewDetailPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { viewId } = useParams<{ viewId: string }>()
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { addToast } = useToastStore()
    const [isCreating, setIsCreating] = useState(false)
    const [newObjectName, setNewObjectName] = useState("")
    const [newObjectData, setNewObjectData] = useState("")

    const { data: view, isLoading: isViewLoading } = useQuery({
        queryKey: ['view', currentWorkspaceId, viewId],
        queryFn: () => getView(currentWorkspaceId, viewId!),
        enabled: !!currentWorkspaceId && !!viewId,
    })

    const { data: viewObjects, refetch: refetchViewObjects } = useQuery({
        queryKey: ['view-objects', currentWorkspaceId, viewId],
        queryFn: () => getViewObjects(currentWorkspaceId, viewId!),
        enabled: !!currentWorkspaceId && !!viewId,
    })

    // Determine the object type based on view type
    const getObjectType = (): ViewObjectType => {
        if (view?.type === 'calendar') return 'calendar_slot'
        if (view?.type === 'map') return 'map_marker'
        return 'calendar_slot' // default
    }

    const createMutation = useMutation({
        mutationFn: (data: { name: string; data: string }) =>
            createViewObject(currentWorkspaceId, viewId!, {
                name: data.name,
                type: getObjectType(),
                data: data.data
            }),
        onSuccess: () => {
            addToast({ title: t('views.objectCreatedSuccess'), type: 'success' })
            refetchViewObjects()
            handleCloseModal()
        },
        onError: () => {
            addToast({ title: t('views.objectCreatedError'), type: 'error' })
        }
    })

    const handleCloseModal = () => {
        setIsCreating(false)
        setNewObjectName("")
        setNewObjectData("")
    }

    const deleteMutation = useMutation({
        mutationFn: (objectId: string) => deleteViewObject(currentWorkspaceId, viewId!, objectId),
        onSuccess: () => {
            addToast({ title: t('views.objectDeletedSuccess'), type: 'success' })
            refetchViewObjects()
        },
        onError: () => {
            addToast({ title: t('views.objectDeletedError'), type: 'error' })
        }
    })

    const handleCreate = () => {
        if (newObjectName.trim()) {
            createMutation.mutate({ name: newObjectName.trim(), data: newObjectData })
        }
    }

    const handleDelete = (objectId: string) => {
        if (window.confirm(t('views.deleteObjectConfirm'))) {
            deleteMutation.mutate(objectId)
        }
    }

    if (isViewLoading) {
        return <div className="flex justify-center items-center h-screen">{t('common.loading')}</div>
    }

    if (!view) {
        return <div className="flex justify-center items-center h-screen">{t('views.viewNotFound')}</div>
    }

    return (
        <TwoColumn>
            <TwoColumnMain className="bg-white dark:bg-neutral-800">
                <ViewContent
                    view={view}
                    viewObjects={viewObjects}
                    navigate={navigate}
                    currentWorkspaceId={currentWorkspaceId}
                    isCreating={isCreating}
                    setIsCreating={setIsCreating}
                    handleCloseModal={handleCloseModal}
                    newObjectName={newObjectName}
                    setNewObjectName={setNewObjectName}
                    newObjectData={newObjectData}
                    setNewObjectData={setNewObjectData}
                    handleCreate={handleCreate}
                    createMutation={createMutation}
                />
            </TwoColumnMain>

            <TwoColumnSidebar className="bg-white">
                <Outlet context={{
                    view,
                    viewObjects,
                    handleDelete,
                    deleteMutation,
                    refetchViewObjects,
                    workspaceId: currentWorkspaceId,
                    viewId: viewId!
                }} />
            </TwoColumnSidebar>
        </TwoColumn>
    )
}

// Main content component - renders different views based on type
const ViewContent = (props: any) => {
    if (props.view.type === 'calendar') {
        return <CalendarViewContent {...props} />
    }
    if (props.view.type === 'map') {
        return <MapViewContent {...props} />
    }
    return null
}

export default ViewDetailPage