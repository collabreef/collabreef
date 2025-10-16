import { Link } from "react-router-dom"
import { useEffect } from "react"
import { useSidebar } from "../sidebar/SidebarProvider"
import { useWorkspaceStore } from "@/stores/workspace"
import WorkspaceMenu from "../workspacemenu/WorkspaceMenu"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { BookText, Sparkles } from 'lucide-react'
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
            <div className=" flex flex-col gap-1 overflow-y-auto">
                <div className="">
                    <Tooltip
                        text={t("menu.notes")}
                        side="right"
                        enabled={isCollapse}
                        >
                        <Link to={`/workspaces/${currentWorkspaceId}`} className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700">
                            <BookText size={20} />
                            {!isCollapse && t("menu.notes")}
                        </Link>
                    </Tooltip>
                </div>
                <div className="">
                    <Tooltip
                        text={t("menu.genTemplates")}
                        side="right"
                        enabled={isCollapse}
                        >
                        <Link to={`/workspaces/${currentWorkspaceId}/gen-templates`} className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700">
                            <Sparkles size={20} />
                            {!isCollapse && t("menu.genTemplates")}
                        </Link>
                    </Tooltip>
                </div>
            </div>
        </div>
    )

    return <BaseLayout sidebarContent={sidebarContent} />
}

export default WorkspaceLayout