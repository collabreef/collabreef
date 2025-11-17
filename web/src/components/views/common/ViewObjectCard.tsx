import { Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ViewObject } from "@/types/view"
import ViewObjectDataDisplay from "./ViewObjectDataDisplay"

interface ViewObjectCardProps {
    viewObject: ViewObject
    onClick: () => void
    onDelete?: (objectId: string) => void
    isDeleting?: boolean
    showDelete?: boolean
}

const ViewObjectCard = ({
    viewObject,
    onClick,
    onDelete,
    isDeleting = false,
    showDelete = false
}: ViewObjectCardProps) => {
    const { t } = useTranslation()

    return (
        <div
            className="bg-white dark:bg-neutral-800 rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500 dark:hover:border-blue-500"
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 truncate text-ellipsis">
                    <div className="font-semibold mb-2">{viewObject.name}</div>
                    {viewObject.data && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            <ViewObjectDataDisplay viewObject={viewObject} variant="card" />
                        </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                        {t('views.createdBy')}: {viewObject.created_by}
                    </p>
                </div>
                {showDelete && onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete(viewObject.id)
                        }}
                        aria-label="delete"
                        disabled={isDeleting}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg disabled:opacity-50"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    )
}

export default ViewObjectCard