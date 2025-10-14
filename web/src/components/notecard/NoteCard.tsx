import { FC } from "react"
import { Link } from "react-router-dom"
import { MoveDiagonal } from "lucide-react"
import { NoteData } from "../../api/note"
import NoteTime from "../notetime/NoteTime"
import ExpandableNote from "../expandablenote/ExpandableNote"

interface NoteCardProps {
    note: NoteData
    linkTo?: string
    showLink?: boolean
}

const NoteCard: FC<NoteCardProps> = ({ note, linkTo, showLink = true }) => {
    return (
        <div className="bg-white dark:bg-neutral-800 border sm:shadow-sm dark:border-neutral-600 rounded-lg overflow-auto flex flex-col gap-2">
            <div className="flex justify-between text-gray-500 px-4 pt-4">
                <div>
                    <NoteTime time={note.updated_at ?? ""} />
                </div>
                {showLink && linkTo && (
                    <div>
                        <Link to={linkTo}>
                            <MoveDiagonal size={16} />
                        </Link>
                    </div>
                )}
            </div>
            <div className="break-all w-full flex flex-col m-auto">
                <ExpandableNote note={note} />
            </div>
        </div>
    )
}

export default NoteCard