import { twMerge } from "tailwind-merge"
import Sidebar from "../sidebar/Sidebar"
import { useSidebar } from "../sidebar/SidebarProvider"
import { Link, Outlet } from "react-router-dom"
import { useEffect } from "react"
import Main from "../main/Main"
import { Laptop2, LogIn, Monitor } from 'lucide-react'
import { useTranslation } from "react-i18next"
import logo from '../../assets/app.png'
import logotext from '../../assets/applogo_text.png'
import { useCurrentUserStore } from "../../stores/current-user"

const PublicLayout = () => {
    const { t } = useTranslation()
    const { isOpen, isCollapse, closeSidebar, isOver1280 } = useSidebar()
    const { user } = useCurrentUserStore()

    useEffect(() => {
        closeSidebar()
    }, [location])

    return <>
        <div className='flex justify-center relative'>
            <div className={twMerge("flex", isOver1280 ? isCollapse ? "w-[72px]" : "w-[260px]" : isOpen ? "w-full absolute top-0 z-30" : "")}>
                <Sidebar
                >
                    <div className="flex flex-col gap-3">
                        <div className="pt-4">
                            <div className={twMerge("flex gap-5 items-center ", isCollapse ? "justify-center": "justify-start px-4")}>
                                <img src={logo} className="w-8 h-8" aria-label="logo" />
                                {!isCollapse && <img src={logotext} className='w-28' alt="logo" />}
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

export default PublicLayout