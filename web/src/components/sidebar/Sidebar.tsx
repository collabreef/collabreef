import { Ellipsis, EllipsisVertical, PanelLeftClose, PanelLeftOpen, Settings, Telescope, UserCircle2 } from "lucide-react"
import { twMerge } from "tailwind-merge"
import { useSidebar } from "./SidebarProvider"
import ThemeButton from "../themebutton/ThemeButton"
import { Link } from "react-router-dom"
import { FC, ReactNode } from "react"
import { useCurrentUserStore } from "../../stores/current-user"
import Tooltip from "../tooltip/Tooltip"
import { useTranslation } from "react-i18next"

interface Props {
    children: ReactNode
}

const Sidebar: FC<Props> = function ({ children }) {
    const { isOpen, isCollapse, isOver1280, expandSidebar, collapseSidebar } = useSidebar()
    const { user } = useCurrentUserStore();
    const { t } = useTranslation()
    return <>
        <aside id="logo-sidebar"
            onClick={e => e.stopPropagation()}
            className={twMerge(isOver1280 ? "flex" :
                isOpen ? "translate-x-0" : "-translate-x-full"
                , isCollapse ? "w-[72px]" : " w-[260px]"
                , " transition duration-200 ease-in-out transform fixed xl:static top-0 left-0 xl:flex-col gap-0.5 h-[100dvh] bg-opacity-100 ")}
            aria-label="Sidebar">
            <div className="px-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between h-full ">
                {children}
                <div className={twMerge("pt-1 pb-3 flex gap-1 flex-wrap-reverse", isCollapse ? "flex-col" : "flex-row")}>

                    <Tooltip
                        text={t("menu.explore")}
                        side="right"
                        enabled={isCollapse}
                    >
                        <Link to="/explore/notes" className="p-2">
                            <Telescope size={20} />
                        </Link>
                    </Tooltip>

                    {
                        user && <Tooltip
                            text={t("menu.user")}
                            side="right"
                            enabled={isCollapse}
                        >
                            <>
                                <Link to="/user/" className="p-2">
                                    <Settings size={20} />
                                </Link>
                            </>
                        </Tooltip>
                    }
                    {
                        <Tooltip
                            text={t("actions.toggleTheme")}
                            side="right"
                            enabled={isCollapse}>
                            <ThemeButton/>
                        </Tooltip>
                    }
                    {
                        isOver1280 &&
                        <Tooltip
                            text={t("actions.expand")}
                            side="right"
                            enabled={isCollapse}
                        >
                            <button className="p-2" onClick={() => isCollapse ? expandSidebar() : collapseSidebar()} >
                                {
                                    isCollapse ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />
                                }
                            </button>
                        </Tooltip>
                    }
                </div>
            </div>
        </aside>
    </>
}
export default Sidebar