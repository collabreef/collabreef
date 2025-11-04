import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { FileText } from "lucide-react"
import { getPublicNotesForViewObject } from "@/api/view"
import Renderer from "@/components/renderer/Renderer"
import NoteTime from "@/components/notetime/NoteTime"

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
            {/* Linked Notes List */}
                        {linkedNotes.length > 0 ? (
                <div className="space-y-2">
                    {linkedNotes.map((note: any) => (
                        <div
                            key={note.id}
                            className="flex flex-col rounded border shadow-sm py-4 group bg-white dark:bg-neutral-900"
                        >
                            <div className="flex justify-between px-4 pb-4">
                                <div>
                                    <NoteTime time={note.created_at} /> 
                                </div>
                            </div>
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