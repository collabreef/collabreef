import { twMerge } from "tailwind-merge"
import Sidebar from "../sidebar/Sidebar"
import { useSidebar } from "../sidebar/SidebarProvider"
import { Link, Outlet, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import Main from "../main/Main"
import { Brain, BrainCog, CornerUpLeft, LogOut, Settings, Settings2 } from 'lucide-react'
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { signOut } from "../../api/auth"
import { useWorkspaceStore } from "../../stores/workspace"
import Tooltip from "../tooltip/Tooltip"

const UserLayout = () => {
    const { t } = useTranslation()
    const { isOpen, isCollapse, closeSidebar, isOver1280 } = useSidebar()
    const navigate = useNavigate()
    const { reset } = useWorkspaceStore()
    const signoutMutation = useMutation({
        mutationFn: () => signOut(),
        onSuccess: async () => {
            try {
                reset();
                navigate(`/`)
            } catch (error) {
                console.error('Error invalidating queries:', error)

            }
        },
    })

    const handleLogout = () => {
        signoutMutation.mutate()
    }

    useEffect(() => {
        closeSidebar()
    }, [location])

    return <>
        <div className='flex justify-center relative'>
            <div className={twMerge("flex", isOver1280 ? isCollapse ? "w-[72px]" : "w-[260px]" : isOpen ? "w-full absolute top-0 z-30" : "")}>
                <Sidebar>
                    <div className="flex flex-col gap-3">
                        <div className="pt-4">
                            <Link to="/" className="p-2 flex gap-2">
                                <CornerUpLeft size={20} />
                                {!isCollapse && <>{t("menu.user")}</>}
                            </Link>
                        </div>
                        <div className=" flex flex-col gap-2 overflow-y-auto">
                            <Tooltip
                                text={t("menu.preferences")}
                                side="right"
                                enabled={isCollapse}>
                                <Link to="/user/preferences" className="p-2 flex gap-2">
                                    <Settings2 size={20} />
                                    {!isCollapse && <>{t("menu.preferences")}</>}
                                </Link>
                            </Tooltip>
                            <Tooltip
                                text={t("menu.models")}
                                side="right"
                                enabled={isCollapse}>
                                <Link to="/user/models" className="p-2 flex gap-2">
                                    <Brain size={20} />
                                    {!isCollapse && <>{t("menu.models")}</>}
                                </Link>
                            </Tooltip>
                            <Tooltip
                                text={t("actions.signout")}
                                side="right"
                                enabled={isCollapse}>
                                <button onClick={handleLogout} className="w-full p-2 flex gap-2 items-center">
                                    <LogOut size={20} />
                                    {!isCollapse && <>{t("actions.signout")}</>}
                                </button>
                            </Tooltip>
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

export default UserLayout