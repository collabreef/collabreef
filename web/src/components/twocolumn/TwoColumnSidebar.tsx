import { ReactNode } from "react"
import { useTwoColumn } from "./TwoColumn"

interface TwoColumnSidebarProps {
    children: ReactNode
    className?: string
}

export const TwoColumnSidebar = ({ children, className = "" }: TwoColumnSidebarProps) => {
    const { isSidebarCollapsed } = useTwoColumn()

    return (
        <div
            className={`${
                isSidebarCollapsed
                    ? 'hidden lg:hidden'
                    : 'max-w-full overflow-x-hidden h-screen fixed right-0 top-0 lg:static'
            } border-x  overflow-y-auto transition-all duration-300 z-50 ${className}`}
        >
            {children}
        </div>
    )
}

export default TwoColumnSidebar