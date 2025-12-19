import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { PlusCircle } from "lucide-react"
import { ViewObject } from "@/types/view"
import ViewObjectCard from "./ViewObjectCard"
import ViewObjectSearchBar from "./ViewObjectSearchBar"

interface ViewObjectsListBaseProps {
    viewObjects: ViewObject[]
    onObjectClick: (objectId: string) => void
    onDelete?: (objectId: string) => void
    isDeleting?: boolean
    showDelete?: boolean
    emptyMessage: string
    emptyHint?: string
    showCreateButton?: boolean
    onCreateClick?: () => void
    createButtonTitle?: string
}

const ViewObjectsListBase = ({
    viewObjects,
    onObjectClick,
    onDelete,
    isDeleting = false,
    showDelete = false,
    emptyMessage,
    emptyHint,
    showCreateButton = false,
    onCreateClick,
    createButtonTitle
}: ViewObjectsListBaseProps) => {
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = useState("")

    const filteredViewObjects = useMemo(() => {
        if (!viewObjects || !searchQuery.trim()) return viewObjects

        const query = searchQuery.toLowerCase().trim()
        return viewObjects.filter((obj: ViewObject) => {
            return obj.name?.toLowerCase().includes(query)
        })
    }, [viewObjects, searchQuery])

    return (
        <div className="w-full">
            <div className="p-4 flex flex-col gap-4 overflow-x-hidden bg-neutral-100 dark:bg-neutral-900 min-h-screen">
                <div className="flex items-center gap-2">
                    <ViewObjectSearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />
                    {showCreateButton && onCreateClick && (
                        <button
                            onClick={onCreateClick}
                            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg flex-shrink-0"
                            title={createButtonTitle}
                        >
                            <PlusCircle size={20} />
                        </button>
                    )}
                </div>
                <div className="space-y-4">
                    {filteredViewObjects && filteredViewObjects.length > 0 ? (
                        filteredViewObjects.map((obj: ViewObject) => (
                            <ViewObjectCard
                                key={obj.id}
                                viewObject={obj}
                                onClick={() => onObjectClick(obj.id)}
                                onDelete={onDelete}
                                isDeleting={isDeleting}
                                showDelete={showDelete}
                            />
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <p className="text-sm mt-4">
                                {searchQuery.trim() ? t('common.noResults') : emptyMessage}
                            </p>
                            {!searchQuery.trim() && emptyHint && (
                                <p className="text-xs mt-2">{emptyHint}</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ViewObjectsListBase