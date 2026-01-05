import { MapPin } from "lucide-react"
import { useTwoColumn } from "@/components/twocolumn"
import MapViewComponent from "./MapViewComponent"
import ViewHeader from "../common/ViewHeader"
import ViewMenu from "@/components/viewmenu/ViewMenu"

interface MapViewContentProps {
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

const MapViewContent = ({
    view,
    viewObjects,
    focusedObjectId
}: MapViewContentProps) => {
    const { isSidebarCollapsed, toggleSidebar } = useTwoColumn()

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-shrink-0">
                <ViewHeader
                    menu={<ViewMenu viewType="map" currentViewId={view.id} />}
                    rightActions={
                        <>
                            <div className="px-4 flex gap-2">
                                <button
                                    onClick={toggleSidebar}
                                    className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                                    title={isSidebarCollapsed ? "Show Sidebar" : "Hide Sidebar"}
                                >
                                    <MapPin size={18} />
                                </button>
                            </div>
                        </>
                    }
                />
            </div>

            <div className="flex-1 overflow-hidden">
                <MapViewComponent viewObjects={viewObjects} view={view} focusedObjectId={focusedObjectId} />
            </div>
        </div>
    )
}

export default MapViewContent