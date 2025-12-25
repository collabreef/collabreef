import { Calendar, Settings } from "lucide-react"
import { useState } from "react"
import { useTwoColumn } from "@/components/twocolumn"
import CalendarViewComponent from "./CalendarViewComponent"
import CreateViewObjectModal from "../CreateViewObjectModal"
import CalendarViewSettingsModal from "./CalendarViewSettingsModal"
import ViewHeader from "../common/ViewHeader"
import ViewMenu from "@/components/viewmenu/ViewMenu"

interface CalendarViewContentProps {
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
    focusedObjectId?: string
}

const CalendarViewContent = ({
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
    focusedObjectId
}: CalendarViewContentProps) => {
    const { isSidebarCollapsed, toggleSidebar } = useTwoColumn()
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    return (
        <div className="w-full">
            <ViewHeader
                menu={<ViewMenu viewType="calendar" currentViewId={view.id} />}
                rightActions={
                    <>
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
                    </>
                }
            />

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

            <CalendarViewComponent
                key={focusedObjectId || 'default'}
                viewObjects={viewObjects}
                focusedObjectId={focusedObjectId}
            />
        </div>
    )
}

export default CalendarViewContent