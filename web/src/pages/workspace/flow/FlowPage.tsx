import { useState } from "react"
import { useParams } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getView, getViewObjects, createViewObject, updateView } from "@/api/view"
import { useToastStore } from "@/stores/toast"
import FlowViewContent from "@/components/views/flow/FlowViewContent"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { FlowViewData, FlowNodeData } from "@/types/view"

const FlowPage = () => {
    const { t } = useTranslation()
    const { flowId } = useParams<{ flowId: string }>()
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { addToast } = useToastStore()
    const [isCreating, setIsCreating] = useState(false)
    const [newObjectName, setNewObjectName] = useState("")
    const [newObjectData, setNewObjectData] = useState("")

    const { data: view, isLoading: isViewLoading } = useQuery({
        queryKey: ['view', currentWorkspaceId, flowId],
        queryFn: () => getView(currentWorkspaceId, flowId!),
        enabled: !!currentWorkspaceId && !!flowId,
    })

    const { data: viewObjects, refetch: refetchViewObjects } = useQuery({
        queryKey: ['view-objects', currentWorkspaceId, flowId],
        queryFn: () => getViewObjects(currentWorkspaceId, flowId!),
        enabled: !!currentWorkspaceId && !!flowId,
    })

    const createMutation = useMutation({
        mutationFn: async (data: { name: string; data: string }) => {
            // Create the view object (node)
            const newViewObject = await createViewObject(currentWorkspaceId, flowId!, {
                name: data.name,
                type: 'flow_node',
                data: data.data
            })

            // Update view.data to include the new node ID
            if (view) {
                try {
                    let viewData: FlowViewData = {}
                    if (view.data) {
                        viewData = JSON.parse(view.data)
                    }

                    const currentNodes = viewData.nodes || (viewObjects || [])
                        .filter((obj: any) => obj.type === 'flow_node')
                        .map((obj: any) => obj.id)
                    const newNodes = [...currentNodes, newViewObject.id]

                    const newViewData: FlowViewData = {
                        ...viewData,
                        nodes: newNodes
                    }

                    await updateView(currentWorkspaceId, flowId!, {
                        data: JSON.stringify(newViewData)
                    })
                } catch (e) {
                    console.error('Failed to update view data after creating node:', e)
                }
            }

            return newViewObject
        },
        onSuccess: () => {
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
            // Parse data or create default node data
            let dataObject: FlowNodeData = {
                position: { x: 100, y: 100 }
            }
            try {
                if (newObjectData) {
                    const parsed = JSON.parse(newObjectData)
                    dataObject = {
                        position: parsed.position || { x: 100, y: 100 },
                        color: parsed.color,
                        width: parsed.width,
                        height: parsed.height
                    }
                }
            } catch (e) {
                // Use default if parse fails
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
        <FlowViewContent
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
        />
    )
}

export default FlowPage
