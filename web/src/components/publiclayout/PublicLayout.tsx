import { twMerge } from "tailwind-merge"
import { useSidebar } from "../sidebar/SidebarProvider"
import { Link } from "react-router-dom"
import { LogIn, Monitor, FileText, Calendar, MapPin, KanbanSquare, PenTool } from 'lucide-react'
import { useTranslation } from "react-i18next"
import logo from '@/assets/app.png'
import { useCurrentUserStore } from "@/stores/current-user"
import BaseLayout from "../baselayout/BaseLayout"

const PublicLayout = () => {
    const { t } = useTranslation()
    const { isCollapse } = useSidebar()
    const { user } = useCurrentUserStore()

    const sidebarContent = (
        <div className="flex flex-col gap-3">
            <div className="pt-4">
                <div className={twMerge("flex gap-2 items-center ", isCollapse ? "justify-center": "justify-start px-2")}>
                    <img src={logo} className="w-8 h-8" aria-label="logo" />
                    {!isCollapse && <div className='text-xl font-extrabold text-gray-600 dark:text-gray-400 font-mono'>Collabreef</div>}
                </div>
            </div>
            <div className=" flex flex-col gap-1 overflow-y-auto h-[calc(100dvh-110px)]">
                <Link to="/explore/notes" className="p-2.5 flex items-center gap-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg">
                    <FileText size={20} />
                    {!isCollapse && <>{t("menu.notes")}</>}
                </Link>

                <Link to="/explore/calendar" className="p-2.5 flex items-center gap-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg">
                    <Calendar size={20} />
                    {!isCollapse && <>{t("views.calendar")}</>}
                </Link>

                <Link to="/explore/map" className="p-2.5 flex items-center gap-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg">
                    <MapPin size={20} />
                    {!isCollapse && <>{t("views.map")}</>}
                </Link>

                <Link to="/explore/kanban" className="p-2.5 flex items-center gap-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg">
                    <KanbanSquare size={20} />
                    {!isCollapse && <>{t("views.kanban") || "Kanban"}</>}
                </Link>

                <Link to="/explore/whiteboard" className="p-2.5 flex items-center gap-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg">
                    <PenTool size={20} />
                    {!isCollapse && <>{t("views.whiteboard") || "Whiteboard"}</>}
                </Link>

                <div className="my-2 border-t dark:border-neutral-700"></div>

                {
                    user ? <Link to="/" className="p-2.5 flex items-center gap-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg">
                        <Monitor size={20} />
                        {!isCollapse && <>{t("menu.workspace")}</>}
                    </Link>
                        : <Link to="/signin" className="p-2.5 flex items-center gap-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg">
                            <LogIn size={20} />
                            {!isCollapse && <>{t("actions.signin")}</>}
                        </Link>
                }

            </div>
        </div>
    )

    return <BaseLayout sidebarContent={sidebarContent} />
}

export default PublicLayout