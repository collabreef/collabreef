import { useState } from "react"
import { useNavigate, useParams, Outlet } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getView, getViewObjects, createViewObject, deleteViewObject } from "@/api/view"
import { useToastStore } from "@/stores/toast"
import { TwoColumn, TwoColumnMain, TwoColumnSidebar } from "@/components/twocolumn"
import MapViewContent from "@/components/views/map/MapViewContent"
import MapMarkersList from "@/components/views/map/MapMarkersList"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"

const MapPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { mapId, markerId } = useParams<{ mapId: string; markerId?: string }>()
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { addToast } = useToastStore()
    const [isCreating, setIsCreating] = useState(false)
    const [newObjectName, setNewObjectName] = useState("")
    const [newObjectData, setNewObjectData] = useState("")

    const { data: view, isLoading: isViewLoading } = useQuery({
        queryKey: ['view', currentWorkspaceId, mapId],
        queryFn: () => getView(currentWorkspaceId, mapId!),
        enabled: !!currentWorkspaceId && !!mapId,
    })

    const { data: viewObjects, refetch: refetchViewObjects } = useQuery({
        queryKey: ['view-objects', currentWorkspaceId, mapId],
        queryFn: () => getViewObjects(currentWorkspaceId, mapId!),
        enabled: !!currentWorkspaceId && !!mapId,
    })

    const createMutation = useMutation({
        mutationFn: (data: { name: string; data: string }) =>
            createViewObject(currentWorkspaceId, mapId!, {
                name: data.name,
                type: 'map_marker',
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

    const deleteMutation = useMutation({
        mutationFn: (objectId: string) => deleteViewObject(currentWorkspaceId, mapId!, objectId),
        onSuccess: () => {
            addToast({ title: t('views.objectDeletedSuccess'), type: 'success' })
            refetchViewObjects()
        },
        onError: () => {
            addToast({ title: t('views.objectDeletedError'), type: 'error' })
        }
    })

    const handleCloseModal = () => {
        setIsCreating(false)
        setNewObjectName("")
        setNewObjectData("")
    }

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
            <TwoColumnMain>
                <MapViewContent
                    view={view}
                    viewObjects={viewObjects || []}
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
                    focusedObjectId={markerId}
                />
            </TwoColumnMain>

            <TwoColumnSidebar className="bg-white">
                {markerId ? (
                    <Outlet context={{
                        view,
                        viewObjects: viewObjects || [],
                        workspaceId: currentWorkspaceId,
                        viewId: mapId
                    }} />
                ) : (
                    <MapMarkersList
                        markers={viewObjects || []}
                        workspaceId={currentWorkspaceId}
                        mapId={mapId!}
                        focusedMarkerId={markerId}
                        onDelete={handleDelete}
                        isDeleting={deleteMutation.isPending}
                        onCreateClick={() => setIsCreating(true)}
                    />
                )}
            </TwoColumnSidebar>
        </TwoColumn>
    )
}

export default MapPage
