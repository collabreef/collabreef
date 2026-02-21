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
        <div className=" dark:border-neutral-700">
            {/* Linked Notes List */}
            {linkedNotes.length > 0 ? (
                <div className="p-4 space-y-2">
                    {linkedNotes.map((note: any) => (
                        <Link
                            key={note.id}
                            to={`/share/notes/${note.id}`}
                            className="flex flex-col gap-2 p-3 rounded shadow-sm group bg-white dark:bg-neutral-800"
                        >
                            <div className="flex justify-between">
                                <div>
                                    <NoteTime time={note.created_at} />
                                </div>
                            </div>
                            <div
                                className="flex-1 cursor-pointer  dark:hover:bg-neutral-800 rounded transition-colors"
                            >
                                <div className="line-clamp-2">
                                    <Renderer content={note.content} />
                                </div>
                            </div>
                        </Link>
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