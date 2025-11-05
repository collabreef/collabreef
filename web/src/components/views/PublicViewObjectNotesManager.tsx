import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getPublicNotesForViewObject } from "@/api/view"
import Renderer from "@/components/renderer/Renderer"
import NoteTime from "@/components/notetime/NoteTime"
import { Link } from "react-router-dom"

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
                            <Link
                                to={`/explore/notes/${note.id}`}
                                className="flex-1 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 rounded transition-colors"
                            >
                                <div className="line-clamp-2 text-xs [&_.prose]:text-xs [&_.prose]:leading-tight">
                                    <Renderer content={note.content} />
                                </div>
                            </Link>
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