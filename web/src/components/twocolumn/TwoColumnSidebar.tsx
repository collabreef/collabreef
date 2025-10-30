import { ReactNode, useEffect } from "react"
import { useTwoColumn } from "./TwoColumn"

interface TwoColumnSidebarProps {
    children: ReactNode
    className?: string
}

export const TwoColumnSidebar = ({ children, className = "" }: TwoColumnSidebarProps) => {
    const { isSidebarCollapsed, toggleSidebar } = useTwoColumn()

    // Prevent body scroll when bottom sheet is open on mobile
    useEffect(() => {
        if (!isSidebarCollapsed && window.innerWidth < 1024) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }

        return () => {
            document.body.style.overflow = ''
        }
    }, [isSidebarCollapsed])

    return (
        <>
            {/* Backdrop - only visible on mobile when sidebar is open */}
            {!isSidebarCollapsed && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar */}
            <div
                className={`${
                    isSidebarCollapsed
                        ? 'translate-y-full lg:translate-y-0'
                        : 'translate-y-0'
                }
                fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl
                lg:static lg:max-h-none lg:rounded-none lg:h-screen
                border-x overflow-y-auto transition-transform duration-300 ease-out z-50 ${className}`}
            >
                {children}
            </div>
        </>
    )
}

export default TwoColumnSidebar