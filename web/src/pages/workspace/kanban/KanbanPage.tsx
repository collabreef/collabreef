import { useState } from "react"
import { useParams } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getView, getViewObjects, createViewObject, updateView } from "@/api/view"
import { useToastStore } from "@/stores/toast"
import KanbanViewContent from "@/components/views/kanban/KanbanViewContent"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import OneColumn from "@/components/onecolumn/OneColumn"
import { KanbanViewData } from "@/types/view"

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
        mutationFn: async (data: { name: string; data: string }) => {
            // Create the view object
            const newViewObject = await createViewObject(currentWorkspaceId, kanbanId!, {
                name: data.name,
                type: 'kanban_column',
                data: data.data
            })

            // Update view.data to include the new column ID
            if (view) {
                try {
                    let viewData: KanbanViewData = {}
                    if (view.data) {
                        viewData = JSON.parse(view.data)
                    }

                    const currentColumns = viewData.columns || (viewObjects || []).map((obj: any) => obj.id)
                    const newColumns = [...currentColumns, newViewObject.id]

                    const newViewData: KanbanViewData = {
                        ...viewData,
                        columns: newColumns
                    }

                    await updateView(currentWorkspaceId, kanbanId!, {
                        data: JSON.stringify(newViewData)
                    })
                } catch (e) {
                    console.error('Failed to update view data after creating column:', e)
                }
            }

            return newViewObject
        },
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
            // Parse data (no longer need to add order here)
            let dataObject: any = {}
            try {
                if (newObjectData) {
                    dataObject = JSON.parse(newObjectData)
                }
            } catch (e) {
                // ignore parse errors
            }

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
