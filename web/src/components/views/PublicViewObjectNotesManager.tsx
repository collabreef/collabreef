import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { FileText } from "lucide-react"
import { getPublicNotesForViewObject } from "@/api/view"
import Renderer from "@/components/renderer/Renderer"

interface PublicViewObjectNotesManagerProps {
    viewId: string
    viewObjectId: string
}

const PublicViewObjectNotesManager = ({
    viewId,
    viewObjectId
}: PublicViewObjectNotesManagerProps) => {
    const { t } = useTranslation()

    // Fetch linked notes
    const { data: linkedNotes = [] } = useQuery({
        queryKey: ['public-view-object-notes', viewId, viewObjectId],
        queryFn: () => getPublicNotesForViewObject(viewId, viewObjectId),
        enabled: !!viewObjectId
    })

    return (
        <div className="mt-4 border-t dark:border-neutral-700 pt-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <FileText size={14} />
                    <h4 className="text-sm font-semibold">{t('views.linkedNotes')}</h4>
                    <span className="text-xs text-gray-500">({linkedNotes.length})</span>
                </div>
            </div>

            {/* Linked Notes List */}
            {linkedNotes.length > 0 ? (
                <div className="space-y-2">
                    {linkedNotes.map((note: any) => (
                        <div
                            key={note.id}
                            className="flex items-start justify-between p-2 bg-gray-50 dark:bg-neutral-800 rounded text-xs"
                        >
                            <div className="flex-1 min-w-0 overflow-hidden max-h-16">
                                <div className="line-clamp-2 text-xs [&_.prose]:text-xs [&_.prose]:leading-tight">
                                    <Renderer content={note.content} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-gray-500 text-center py-4">
                    {t('views.noLinkedNotes')}
                </p>
            )}
        </div>
    )
}

export default PublicViewObjectNotesManager