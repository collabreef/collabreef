import { ArrowLeft, Calendar, PlusCircle, Settings } from "lucide-react"
import { useTwoColumn } from "@/components/twocolumn"
import CalendarViewComponent from "./CalendarViewComponent"
import CreateViewObjectModal from "../CreateViewObjectModal"
import CalendarViewSettingsModal from "./CalendarViewSettingsModal"
import { useState } from "react"

interface CalendarViewContentProps {
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
}

const CalendarViewContent = ({
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
    createMutation
}: CalendarViewContentProps) => {
    const { isSidebarCollapsed, toggleSidebar } = useTwoColumn()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    return (
        <div className="px-4 w-full">
            <div className="py-4">
                <div className="flex items-center justify-between mb-6">
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
                            <Calendar size={18} />
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

                <CreateViewObjectModal
                    open={isCreating}
                    onOpenChange={(open) => {
                        if (!open) handleCloseModal()
                        else setIsCreating(true)
                    }}
                    viewType="calendar"
                    name={newObjectName}
                    setName={setNewObjectName}
                    data={newObjectData}
                    setData={setNewObjectData}
                    onSubmit={handleCreate}
                    isSubmitting={createMutation.isPending}
                />

                <CalendarViewSettingsModal
                    open={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                    view={view}
                    workspaceId={currentWorkspaceId}
                />

                <CalendarViewComponent viewObjects={viewObjects} />
            </div>
        </div>
    )
}

export default CalendarViewContent