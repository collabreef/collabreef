import { twMerge } from "tailwind-merge"
import Sidebar from "../sidebar/Sidebar"
import { useSidebar } from "../sidebar/SidebarProvider"
import { Outlet } from "react-router-dom"
import { useEffect } from "react"
import Main from "../main/Main"

const WorkspaceLayout = () => {
    const { isOpen, isCollapse, closeSidebar, isOver1280 } = useSidebar()
    useEffect(() => {
        closeSidebar()
    }, [location])

    return <>
        <div className='flex justify-center relative'>
            <div className={twMerge("flex", isOver1280 ? isCollapse ? "w-[72px]" : "w-[260px]" : isOpen ? "w-full absolute top-0 z-30" : "")}>
                <Sidebar />
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