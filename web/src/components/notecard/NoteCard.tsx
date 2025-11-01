import { FC } from "react"
import { Link } from "react-router-dom"
import { NoteData } from "@/api/note"
import NoteTime from "../notetime/NoteTime"
import FullNote from "../fullnote/FullNote"

interface NoteCardProps {
    note: NoteData
    linkTo: string
}

const NoteCard: FC<NoteCardProps> = ({ note, linkTo }) => {
    return (
        <Link to={linkTo} className="bg-white dark:bg-neutral-800 border sm:shadow-sm dark:border-neutral-600 rounded-lg overflow-auto flex flex-col gap-2 py-4">
            <div className="flex justify-between text-gray-500 px-4">
                <div>
                    <NoteTime time={note.updated_at ?? ""} />
                </div>
            </div>
            <div className="break-all w-full flex flex-col m-auto">
                <FullNote note={note} />
            </div>
        </Link>
    )
}

export default NoteCard