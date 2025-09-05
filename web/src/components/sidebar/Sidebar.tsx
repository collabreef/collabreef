import { Link } from "react-router-dom"
import { PanelLeftClose, PanelLeftOpen, Text } from "lucide-react"
import { twMerge } from "tailwind-merge"
import { useSidebar } from "./SidebarProvider"
import WorkspaceMenu from "../workspacemenu/WorkspaceMenu"
import { useTranslation } from 'react-i18next';
import ThemeButton from "../themebutton/ThemeButton"
import { Tooltip } from "radix-ui"
import UserMenu from "../usermenu/UserMenu"
import useCurrentWorkspaceId from "../../hooks/useCurrentworkspaceId"

const Sidebar = function () {
    const { t } = useTranslation();
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { isOpen, isCollapse, isOver1280, expandSidebar, collapseSidebar } = useSidebar()

    return <>
        <aside id="logo-sidebar"
            onClick={e => e.stopPropagation()}
            className={twMerge(isOver1280 ? "flex" :
                isOpen ? "translate-x-0" : "-translate-x-full"
                , isCollapse ? "w-[72px]" : " w-[260px]"
                , " transition duration-200 ease-in-out transform fixed xl:static top-0 left-0 xl:flex-col gap-0.5 h-[100dvh] bg-opacity-100 ")}
            aria-label="Sidebar">
            <div className="px-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between h-full ">
                <div className="grow">
                    <div className="flex flex-col">
                        <div className="flex flex-col gap-3">
                            <div className="pt-4">
                                <WorkspaceMenu />
                            </div>
                            <div className=" flex flex-col gap-1 overflow-y-auto">
                                <div className="">
                                    <Tooltip.Root>
                                        <Tooltip.Trigger asChild>
                                            <Link to={`/workspaces/${currentWorkspaceId}`} className="flex items-center gap-3 w-full p-2.5 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-700">
                                                <Text size={20} />
                                                {!isCollapse && t("menu.notes")}
                                            </Link>
                                        </Tooltip.Trigger>
                                        {
                                            isCollapse && 
                                        <Tooltip.Portal>
                                            <Tooltip.Content
                                                className="select-none rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-black px-2 py-1 text-sm"
                                                side="right"
                                                sideOffset={5}
                                            >
                                                <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-100" />
                                                {t("menu.notes")}
                                            </Tooltip.Content>
                                        </Tooltip.Portal>
                                        }
                                    </Tooltip.Root>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                <div className={twMerge("pt-1 pb-3 flex gap-1", isCollapse ? "flex-col" : "flex-row flex-reverse")}>
                    {
                        isOver1280 &&
                        <button className="p-2" onClick={() => isCollapse ? expandSidebar() : collapseSidebar()} >
                            {
                                isCollapse ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />
                            }
                        </button>
                    }
                    <ThemeButton />
                    <UserMenu />
                </div>
            </div>
        </aside>
    </>
}
export default Sidebar