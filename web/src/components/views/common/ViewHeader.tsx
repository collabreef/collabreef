import { ArrowLeft } from "lucide-react"
import { ReactNode } from "react"

interface ViewHeaderProps {
    viewName: string
    onBack: () => void
    rightActions?: ReactNode
    icon?: ReactNode
}

const ViewHeader = ({ viewName, onBack, rightActions, icon }: ViewHeaderProps) => {
    return (
        <div className="flex items-center justify-between p-4 xl:px-0 bg-neutral-100 dark:bg-neutral-900">
            <div className="flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    aria-label="back"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-2xl font-semibold">{viewName}</span>
                </div>
            </div>
            {rightActions && <div className="flex gap-2">{rightActions}</div>}
        </div>
    )
}

export default ViewHeader