import { FC } from "react"
import { Link } from "react-router-dom"
import { NoteData } from "@/api/note"
import NoteTime from "../notetime/NoteTime"
import Renderer from "@/components/renderer/Renderer"
import { ExternalLink, CornerDownRight } from "lucide-react"

interface NoteCardProps {
    note: NoteData
    linkTo?: string
    showLink?: boolean
    maxNodes?: number
    parentNoteTitle?: string
    parentNoteLinkTo?: string
}

const NoteCard: FC<NoteCardProps> = ({ note, linkTo, showLink = true, maxNodes, parentNoteTitle, parentNoteLinkTo }) => {
    return (
        <div className="bg-white dark:bg-neutral-800 border sm:shadow-sm dark:border-none rounded-lg overflow-auto flex flex-col gap-2 p-4">
            <>
                {note.parent_id && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <CornerDownRight size={12} />
                        {parentNoteLinkTo ? (
                            <Link to={parentNoteLinkTo} className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors truncate max-w-[200px]">
                                {parentNoteTitle || note.parent_id}
                            </Link>
                        ) : (
                            <span className="truncate max-w-[200px]">{parentNoteTitle || note.parent_id}</span>
                        )}
                    </div>
                )}
                <div className="flex justify-between items-center text-gray-500">
                    <div>
                        <NoteTime time={note.created_at ?? ""} />
                    </div>
                    {showLink && (
                        <div>
                            <Link to={linkTo || ""}>
                                <ExternalLink size={16} />
                            </Link>
                        </div>
                    )}
                </div>
                <div className="break-all w-full flex flex-col m-auto">
                    {note.title && (
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                            {note.title}
                        </div>
                    )}
                    {note.content && (
                        <Renderer content={note.content} maxNodes={maxNodes} workspaceId={note.workspace_id} />
                    )}
                </div>
            </>
        </div>
    )
}

export default NoteCard
