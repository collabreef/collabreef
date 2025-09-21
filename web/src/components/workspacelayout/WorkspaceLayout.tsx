import { twMerge } from "tailwind-merge"
import Sidebar from "../sidebar/Sidebar"
import { useSidebar } from "../sidebar/SidebarProvider"
import { Link, Outlet } from "react-router-dom"
import { useEffect } from "react"
import Main from "../main/Main"
import { useWorkspaceStore } from "../../stores/workspace"
import WorkspaceMenu from "../workspacemenu/WorkspaceMenu"
import useCurrentWorkspaceId from "../../hooks/useCurrentworkspaceId"
import { BookText, MonitorCog } from 'lucide-react'
import { useTranslation } from "react-i18next"
import Tooltip from "../tooltip/Tooltip"

const WorkspaceLayout = () => {
    const { t } = useTranslation();
    const { isOpen, isCollapse, closeSidebar, isOver1280 } = useSidebar()
    const { isFetched, fetchWorkspaces } = useWorkspaceStore()
    const currentWorkspaceId = useCurrentWorkspaceId()

    useEffect(() => {
        (async () => {
            if (isFetched) return;
            await fetchWorkspaces();
        })()
    }, [])

    useEffect(() => {
        closeSidebar()
    }, [location])

    return <>
        <div className='flex justify-center relative'>
            <div className={twMerge("flex", isOver1280 ? isCollapse ? "w-[72px]" : "w-[260px]" : isOpen ? "w-full absolute top-0 z-30" : "")}>
                <Sidebar >
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
                                    text={t("menu.workspaceSettings")}
                                    side="right"
                                    enabled={isCollapse}
                                    >
                                    <Link to={`/workspaces/${currentWorkspaceId}/settings`} className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700">
                                        <MonitorCog size={20} />
                                        {!isCollapse && t("menu.workspaceSettings")}
                                    </Link>
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                </Sidebar>
                {
                    isOpen && <div className="2xl:hidden grow bg-opacity-50 bg-black h-[100dvh]" onClick={() => closeSidebar()}></div>
                }
            </div>
            <div className={twMerge(
                isOver1280 ? 'flex flex-col' :
                    isOpen ? '  overflow-hidden sm:overflow-auto'
                        : ' translate-x-0'
                , isCollapse ? "max-w-[1848px]" : "max-w-[1660px]"
                , '  w-full h-[100dvh] flex-1')}>
                <Main>
                    <Outlet />
                </Main>
            </div>
        </div>
    </>
}

export default WorkspaceLayout