import { useState } from "react"
import { useParams } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getView, getViewObjects, createViewObject } from "@/api/view"
import { useToastStore } from "@/stores/toast"
import KanbanViewContent from "@/components/views/kanban/KanbanViewContent"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"

const KanbanPage = () => {
    const { t } = useTranslation()
    const { kanbanId } = useParams<{ kanbanId: string }>()
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { addToast } = useToastStore()
    const [isCreating, setIsCreating] = useState(false)
    const [newObjectName, setNewObjectName] = useState("")
    const [newObjectData, setNewObjectData] = useState("")

    const { data: view, isLoading: isViewLoading } = useQuery({
        queryKey: ['view', currentWorkspaceId, kanbanId],
        queryFn: () => getView(currentWorkspaceId, kanbanId!),
        enabled: !!currentWorkspaceId && !!kanbanId,
    })

    const { data: viewObjects, refetch: refetchViewObjects } = useQuery({
        queryKey: ['view-objects', currentWorkspaceId, kanbanId],
        queryFn: () => getViewObjects(currentWorkspaceId, kanbanId!),
        enabled: !!currentWorkspaceId && !!kanbanId,
    })

    const createMutation = useMutation({
        mutationFn: (data: { name: string; data: string }) =>
            createViewObject(currentWorkspaceId, kanbanId!, {
                name: data.name,
                type: 'kanban_column',
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

    const handleCreate = () => {
        if (newObjectName.trim()) {
            createMutation.mutate({ name: newObjectName.trim(), data: newObjectData })
        }
    }

    if (isViewLoading) {
        return <div className="flex justify-center items-center h-screen">{t('common.loading')}</div>
    }

    if (!view) {
        return <div className="flex justify-center items-center h-screen">{t('views.viewNotFound')}</div>
    }

    return (
        <KanbanViewContent
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
            focusedObjectId={undefined}
        />
    )
}

export default KanbanPage
