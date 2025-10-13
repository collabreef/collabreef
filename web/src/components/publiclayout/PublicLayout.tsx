import { twMerge } from "tailwind-merge"
import { useSidebar } from "../sidebar/SidebarProvider"
import { Link } from "react-router-dom"
import { LogIn, Monitor } from 'lucide-react'
import { useTranslation } from "react-i18next"
import logo from '../../assets/app.png'
import { useCurrentUserStore } from "../../stores/current-user"
import BaseLayout from "../baselayout/BaseLayout"

const PublicLayout = () => {
    const { t } = useTranslation()
    const { isCollapse } = useSidebar()
    const { user } = useCurrentUserStore()

    const sidebarContent = (
        <div className="flex flex-col gap-3">
            <div className="pt-4">
                <div className={twMerge("flex gap-2 items-center ", isCollapse ? "justify-center": "justify-start px-4")}>
                    <img src={logo} className="w-8 h-8" aria-label="logo" />
                    {!isCollapse && <h1 className='text-xl font-extrabold text-yellow-700 font-mono'>UNSEAL</h1>}
                </div>
            </div>
            <div className=" flex flex-col gap-1 overflow-y-auto">
                {
                    user ? <Link to="/" className="p-2 flex items-center gap-2">
                        <Monitor size={20} />
                        {!isCollapse && <>{t("menu.workspace")}</>}
                    </Link>
                        : <Link to="/signin" className="p-2 flex items-center gap-2">
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