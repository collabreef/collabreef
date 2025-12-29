import { useState } from "react"
import { useParams } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getView, getViewObjects, createViewObject } from "@/api/view"
import { useToastStore } from "@/stores/toast"
import KanbanViewContent from "@/components/views/kanban/KanbanViewContent"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import OneColumn from "@/components/onecolumn/OneColumn"

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
            // Calculate the next order value
            let maxOrder = -1
            if (viewObjects && viewObjects.length > 0) {
                viewObjects.forEach((obj: any) => {
                    try {
                        const data = obj.data ? JSON.parse(obj.data) : {}
                        const order = data.order ?? 0
                        if (order > maxOrder) {
                            maxOrder = order
                        }
                    } catch (e) {
                        // ignore parse errors
                    }
                })
            }

            // Parse existing data and add order
            let dataObject: any = {}
            try {
                if (newObjectData) {
                    dataObject = JSON.parse(newObjectData)
                }
            } catch (e) {
                // ignore parse errors
            }

            dataObject.order = maxOrder + 1

            createMutation.mutate({
                name: newObjectName.trim(),
                data: JSON.stringify(dataObject)
            })
        }
    }

    if (isViewLoading) {
        return <div className="flex justify-center items-center h-screen">{t('common.loading')}</div>
    }

    if (!view) {
        return <div className="flex justify-center items-center h-screen">{t('views.viewNotFound')}</div>
    }

    return (
        <OneColumn>
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
        </OneColumn>
    )
}

export default KanbanPage
