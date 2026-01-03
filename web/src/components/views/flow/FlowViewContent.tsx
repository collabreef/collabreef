import { Settings, PlusCircle } from "lucide-react"
import { useState } from "react"
import FlowViewComponent from "./FlowViewComponent"
import CreateViewObjectModal from "../CreateViewObjectModal"
import FlowViewSettingsModal from "./FlowViewSettingsModal"
import ViewHeader from "../common/ViewHeader"
import ViewMenu from "@/components/viewmenu/ViewMenu"

interface FlowViewContentProps {
    view: any
    viewObjects: any[]
    currentWorkspaceId: string
    isCreating: boolean
    setIsCreating: (value: boolean) => void
    handleCloseModal: () => void
    newObjectName: string
    setNewObjectName: (value: string) => void
    newObjectData: string
    setNewObjectData: (value: string) => void
    handleCreate: () => void
    createMutation: any
}

const FlowViewContent = ({
    view,
    viewObjects,
    currentWorkspaceId,
    isCreating,
    setIsCreating,
    handleCloseModal,
    newObjectName,
    setNewObjectName,
    newObjectData,
    setNewObjectData,
    handleCreate,
    createMutation,
}: FlowViewContentProps) => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    return (
        <div className="flex flex-col h-dvh">
            <ViewHeader
                menu={<ViewMenu viewType="flow" currentViewId={view.id} />}
                rightActions={
                    <div className="flex gap-2 px-4">
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            title="create node"
                        >
                            <PlusCircle size={18} />
                        </button>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            title="Settings"
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                }
            />

            <CreateViewObjectModal
                open={isCreating}
                onOpenChange={(open) => {
                    if (!open) handleCloseModal()
                    else setIsCreating(true)
                }}
                viewType="flow"
                name={newObjectName}
                setName={setNewObjectName}
                data={newObjectData}
                setData={setNewObjectData}
                onSubmit={handleCreate}
                isSubmitting={createMutation.isPending}
            />

            <FlowViewSettingsModal
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                view={view}
                workspaceId={currentWorkspaceId}
            />

            <div className="flex-1 overflow-hidden border shadow">
                <FlowViewComponent
                    view={view}
                    viewObjects={viewObjects}
                    workspaceId={currentWorkspaceId}
                    viewId={view.id}
                />
            </div>
        </div>
    )
}

export default FlowViewContent
