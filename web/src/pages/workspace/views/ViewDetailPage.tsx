import { useState, useEffect } from "react"
import { Outlet, useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { ChevronUp } from "lucide-react"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { getView, getViewObjects, createViewObject, deleteViewObject } from "@/api/view"
import { useToastStore } from "@/stores/toast"
import { TwoColumn, TwoColumnMain, TwoColumnSidebar, useTwoColumn } from "@/components/twocolumn"
import { ViewObjectType } from "@/types/view"
import CalendarViewContent from "@/components/views/calendar/CalendarViewContent"
import MapViewContent from "@/components/views/map/MapViewContent"

const ViewDetailPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { viewId, objectId } = useParams<{ viewId: string; objectId?: string }>()
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
            <ViewDetailContent
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
                focusedObjectId={objectId}
                handleDelete={handleDelete}
                deleteMutation={deleteMutation}
                refetchViewObjects={refetchViewObjects}
                viewId={viewId!}
                objectId={objectId}
            />
        </TwoColumn>
    )
}

// Wrapper component to handle sidebar state
const ViewDetailContent = (props: any) => {
    const { isSidebarCollapsed, toggleSidebar } = useTwoColumn()
    const { objectId } = props

    // Auto-open sidebar when navigating to object detail page
    useEffect(() => {
        if (objectId && isSidebarCollapsed) {
            toggleSidebar()
        }
    }, [objectId])

    return (
        <>
            <TwoColumnMain className="bg-white dark:bg-neutral-800 relative">
                <ViewContent
                    view={props.view}
                    viewObjects={props.viewObjects}
                    navigate={props.navigate}
                    currentWorkspaceId={props.currentWorkspaceId}
                    isCreating={props.isCreating}
                    setIsCreating={props.setIsCreating}
                    handleCloseModal={props.handleCloseModal}
                    newObjectName={props.newObjectName}
                    setNewObjectName={props.setNewObjectName}
                    newObjectData={props.newObjectData}
                    setNewObjectData={props.setNewObjectData}
                    handleCreate={props.handleCreate}
                    createMutation={props.createMutation}
                    focusedObjectId={props.objectId}
                />
            </TwoColumnMain>

            <TwoColumnSidebar className="bg-white">
                <Outlet context={{
                    view: props.view,
                    viewObjects: props.viewObjects,
                    handleDelete: props.handleDelete,
                    deleteMutation: props.deleteMutation,
                    refetchViewObjects: props.refetchViewObjects,
                    workspaceId: props.currentWorkspaceId,
                    viewId: props.viewId
                }} />
            </TwoColumnSidebar>
        </>
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