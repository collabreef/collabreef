import { PanelLeftClose, PanelLeftOpen, UserCircle2 } from "lucide-react"
import { twMerge } from "tailwind-merge"
import { useSidebar } from "./SidebarProvider"
import ThemeButton from "../themebutton/ThemeButton"
import { Link } from "react-router-dom"
import UserLogout from "../userlogout/UserLogout"

const Sidebar = function () {
    const { isOpen, isCollapse, isOver1280, expandSidebar, collapseSidebar, content } = useSidebar()

    return <>
        <aside id="logo-sidebar"
            onClick={e => e.stopPropagation()}
            className={twMerge(isOver1280 ? "flex" :
                isOpen ? "translate-x-0" : "-translate-x-full"
                , isCollapse ? "w-[72px]" : " w-[260px]"
                , " transition duration-200 ease-in-out transform fixed xl:static top-0 left-0 xl:flex-col gap-0.5 h-[100dvh] bg-opacity-100 ")}
            aria-label="Sidebar">
            <div className="px-4 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between h-full ">
                {content}
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
                    <Link to="/user/preferences" className="p-2">
                        <UserCircle2 size={20} />
                    </Link>

                    <UserLogout />
                </div>
            </div>
        </aside>
    </>
}
export default Sidebar