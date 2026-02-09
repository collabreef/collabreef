import { Link } from "react-router-dom"
import { useEffect } from "react"
import { useSidebar } from "../sidebar/SidebarProvider"
import { useWorkspaceStore } from "@/stores/workspace"
import WorkspaceMenu from "../workspacemenu/WorkspaceMenu"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { BookText, Paperclip, Home, Calendar, MapPin, KanbanSquare, PenTool, Sheet } from 'lucide-react'
import { useTranslation } from "react-i18next"
import Tooltip from "../tooltip/Tooltip"
import BaseLayout from "../baselayout/BaseLayout"

const WorkspaceLayout = () => {
    const { t } = useTranslation();
    const { isCollapse } = useSidebar()
    const { isFetched, fetchWorkspaces } = useWorkspaceStore()
    const currentWorkspaceId = useCurrentWorkspaceId()

    useEffect(() => {
        (async () => {
            if (isFetched) return;
            await fetchWorkspaces();
        })()
    }, [])

    const sidebarContent = (
        <div className="flex flex-col gap-3">
            <div className="pt-4">
                <WorkspaceMenu />
            </div>
            <div className=" flex flex-col gap-1 overflow-y-auto h-[calc(100dvh-110px)]">
                <div className="">
                    <Tooltip
                        text={t("widgets.home")}
                        side="right"
                        enabled={isCollapse}
                        >
                        <Link to={`/workspaces/${currentWorkspaceId}/home`} className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700">
                            <Home size={20} />
                            {!isCollapse && t("widgets.home")}
                        </Link>
                    </Tooltip>
                </div>
                <div className="">
                    <Tooltip
                        text={t("menu.notes")}
                        side="right"
                        enabled={isCollapse}
                        >
                        <Link to={`/workspaces/${currentWorkspaceId}/notes`} className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700">
                            <BookText size={20} />
                            {!isCollapse && t("menu.notes")}
                        </Link>
                    </Tooltip>
                </div>
                <div className="">
                    <Tooltip
                        text={t("menu.files")}
                        side="right"
                        enabled={isCollapse}
                        >
                        <Link to={`/workspaces/${currentWorkspaceId}/files`} className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700">
                            <Paperclip size={20} />
                            {!isCollapse && t("menu.files")}
                        </Link>
                    </Tooltip>
                </div>
                <div className="">
                    <Tooltip
                        text={t("views.calendar")}
                        side="right"
                        enabled={isCollapse}
                        >
                        <Link to={`/workspaces/${currentWorkspaceId}/calendar`} className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700">
                            <Calendar size={20} />
                            {!isCollapse && t("views.calendar")}
                        </Link>
                    </Tooltip>
                </div>
                <div className="">
                    <Tooltip
                        text={t("views.map")}
                        side="right"
                        enabled={isCollapse}
                        >
                        <Link to={`/workspaces/${currentWorkspaceId}/map`} className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700">
                            <MapPin size={20} />
                            {!isCollapse && t("views.map")}
                        </Link>
                    </Tooltip>
                </div>
                <div className="">
                    <Tooltip
                        text={t("views.kanban") || "Kanban"}
                        side="right"
                        enabled={isCollapse}
                        >
                        <Link to={`/workspaces/${currentWorkspaceId}/kanban`} className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700">
                            <KanbanSquare size={20} />
                            {!isCollapse && (t("views.kanban") || "Kanban")}
                        </Link>
                    </Tooltip>
                </div>
                <div className="">
                    <Tooltip
                        text={t("views.whiteboard") || "Whiteboard"}
                        side="right"
                        enabled={isCollapse}
                        >
                        <Link to={`/workspaces/${currentWorkspaceId}/whiteboard`} className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700">
                            <PenTool size={20} />
                            {!isCollapse && (t("views.whiteboard") || "Whiteboard")}
                        </Link>
                    </Tooltip>
                </div>
                <div className="">
                    <Tooltip
                        text={t("views.spreadsheet") || "Spreadsheet"}
                        side="right"
                        enabled={isCollapse}
                        >
                        <Link to={`/workspaces/${currentWorkspaceId}/spreadsheet`} className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700">
                            <Sheet size={20} />
                            {!isCollapse && (t("views.spreadsheet") || "Spreadsheet")}
                        </Link>
                    </Tooltip>
                </div>
            </div>
        </div>
    )

    return <BaseLayout sidebarContent={sidebarContent} />
}

export default WorkspaceLayout