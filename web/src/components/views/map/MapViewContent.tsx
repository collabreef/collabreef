import { ArrowLeft, MapPin, PlusCircle, Settings } from "lucide-react"
import { useTwoColumn } from "@/components/twocolumn"
import MapViewComponent from "./MapViewComponent"
import CreateViewObjectModal from "../CreateViewObjectModal"
import MapViewSettingsModal from "./MapViewSettingsModal"
import { useState } from "react"

interface MapViewContentProps {
    view: any
    viewObjects: any[]
    navigate: any
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
    focusedObjectId?: string
}

const MapViewContent = ({
    view,
    viewObjects,
    navigate,
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
    focusedObjectId
}: MapViewContentProps) => {
    const { isSidebarCollapsed, toggleSidebar } = useTwoColumn()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    return (
        <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 p-4 bg-neutral-100 dark:bg-neutral-900">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/workspaces/${currentWorkspaceId}/views`)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-semibold">{view.name}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={toggleSidebar}
                            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
                        >
                            <MapPin size={18} />
                        </button>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            title="Settings"
                        >
                            <Settings size={18} />
                        </button>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                            <PlusCircle size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <CreateViewObjectModal
                open={isCreating}
                onOpenChange={(open) => {
                    if (!open) handleCloseModal()
                    else setIsCreating(true)
                }}
                viewType="map"
                name={newObjectName}
                setName={setNewObjectName}
                data={newObjectData}
                setData={setNewObjectData}
                onSubmit={handleCreate}
                isSubmitting={createMutation.isPending}
            />

            <MapViewSettingsModal
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                view={view}
                workspaceId={currentWorkspaceId}
            />

            {/* Map - takes remaining space */}
            <div className="flex-1 overflow-hidden">
                <MapViewComponent viewObjects={viewObjects} view={view} focusedObjectId={focusedObjectId} />
            </div>
        </div>
    )
}

export default MapViewContent