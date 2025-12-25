import SidebarButton from "@/components/sidebar/SidebarButton"
import { ReactNode } from "react"

interface ViewHeaderProps {
    viewName?: string
    menu?: ReactNode
    rightActions?: ReactNode
    icon?: ReactNode
}

const ViewHeader = ({ viewName, menu, rightActions, icon }: ViewHeaderProps) => {
    return (
        <div className="flex items-center justify-between xl:py-4 bg-neutral-100 dark:bg-neutral-900">
            <div className="flex items-center gap-3 p-4 xl:p-0">
                <SidebarButton />
                <div className="flex items-center gap-2">
                    {icon}
                    {menu ? menu : <span className="sm:text-xl font-semibold">{viewName}</span>}
                </div>
            </div>
            {rightActions && <div className="flex gap-2">{rightActions}</div>}
        </div>
    )
}

export default ViewHeader