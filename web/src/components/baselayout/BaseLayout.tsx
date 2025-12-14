import { ReactNode, useEffect } from "react"
import { twMerge } from "tailwind-merge"
import { Outlet } from "react-router-dom"
import Sidebar from "../sidebar/Sidebar"
import { useSidebar } from "../sidebar/SidebarProvider"
import Main from "../main/Main"

interface BaseLayoutProps {
    sidebarContent: ReactNode
}

const BaseLayout = ({ sidebarContent }: BaseLayoutProps) => {
    const { isOpen, isCollapse, closeSidebar, isOver1280 } = useSidebar()

    useEffect(() => {
        closeSidebar()
    }, [location])

    return (
        <div className='flex justify-center relative'>
            <div className={twMerge("flex", isOver1280 ? isCollapse ? "w-[72px]" : "w-[260px]" : isOpen ? "w-full absolute top-0 z-30" : "")}>
                <Sidebar>
                    {sidebarContent}
                </Sidebar>
                {
                    isOpen && <div className="2xl:hidden grow bg-opacity-50 bg-black h-[100dvh]" onClick={() => closeSidebar()}></div>
                }
            </div>
            <div className={twMerge(
                isCollapse ? "max-w-[calc(100vw-72px)] 3xl:max-w-[1848px]" : "max-w-[calc(100vw-260px)] 3xl:max-w-[1660px] pl-4"
                , isOver1280 ? 'flex flex-col' :
                    isOpen ? '  overflow-hidden sm:overflow-auto max-w-full'
                        : ' translate-x-0 max-w-full'
                , '  w-full h-[100dvh] flex-1')}>
                <Main>
                    <Outlet />
                </Main>
            </div>
        </div>
    )
}

export default BaseLayout
