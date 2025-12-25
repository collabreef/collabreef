import { useState } from "react"
import { useParams, Outlet } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getView, getViewObjects, createViewObject, deleteViewObject } from "@/api/view"
import { useToastStore } from "@/stores/toast"
import { TwoColumn, TwoColumnMain, TwoColumnSidebar } from "@/components/twocolumn"
import CalendarViewContent from "@/components/views/calendar/CalendarViewContent"
import CalendarSlotsList from "@/components/views/calendar/CalendarSlotsList"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"

const CalendarPage = () => {
    const { t } = useTranslation()
    const { calendarId, slotId } = useParams<{ calendarId: string; slotId?: string }>()
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { addToast } = useToastStore()
    const [isCreating, setIsCreating] = useState(false)
    const [newObjectName, setNewObjectName] = useState("")
    const [newObjectData, setNewObjectData] = useState("")

    const { data: view, isLoading: isViewLoading } = useQuery({
        queryKey: ['view', currentWorkspaceId, calendarId],
        queryFn: () => getView(currentWorkspaceId, calendarId!),
        enabled: !!currentWorkspaceId && !!calendarId,
    })

    const { data: viewObjects, refetch: refetchViewObjects } = useQuery({
        queryKey: ['view-objects', currentWorkspaceId, calendarId],
        queryFn: () => getViewObjects(currentWorkspaceId, calendarId!),
        enabled: !!currentWorkspaceId && !!calendarId,
    })

    const createMutation = useMutation({
        mutationFn: (data: { name: string; data: string }) =>
            createViewObject(currentWorkspaceId, calendarId!, {
                name: data.name,
                type: 'calendar_slot',
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
        mutationFn: (objectId: string) => deleteViewObject(currentWorkspaceId, calendarId!, objectId),
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
                <CalendarViewContent
                    view={view}
                    viewObjects={viewObjects || []}
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
                    focusedObjectId={slotId}
                />
            </TwoColumnMain>

            <TwoColumnSidebar className="bg-white">
                {slotId ? (
                    <Outlet context={{
                        view,
                        viewObjects: viewObjects || [],
                        workspaceId: currentWorkspaceId,
                        viewId: calendarId
                    }} />
                ) : (
                    <CalendarSlotsList
                        slots={viewObjects || []}
                        workspaceId={currentWorkspaceId}
                        calendarId={calendarId!}
                        focusedSlotId={slotId}
                        onDelete={handleDelete}
                        isDeleting={deleteMutation.isPending}
                        onCreateClick={() => setIsCreating(true)}
                    />
                )}
            </TwoColumnSidebar>
        </TwoColumn>
    )
}

export default CalendarPage
