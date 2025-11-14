import { FC } from "react"
import { Link } from "react-router-dom"
import { NoteData } from "@/api/note"
import NoteTime from "../notetime/NoteTime"
import FullNote from "../fullnote/FullNote"

interface NoteCardProps {
    note: NoteData
    linkTo?: string
    showLink?: boolean
}

const NoteCard: FC<NoteCardProps> = ({ note, linkTo }) => {
    const content = (
        <>
            <div className="flex justify-between text-gray-500 px-4">
                <div>
                    <NoteTime time={note.updated_at ?? ""} />
                </div>
            </div>
            <div className="break-all w-full flex flex-col m-auto">
                {note.title ? (
                    <div className="text-2xl font-bold px-4 text-gray-900 dark:text-gray-100">
                        {note.title}
                    </div>
                ) : (
                    <FullNote note={note} />
                )}
            </div>
        </>
    )

    if (!linkTo) {
        return (
            <div className="bg-white dark:bg-neutral-800 border sm:shadow-sm dark:border-none rounded-lg overflow-auto flex flex-col gap-2 py-4">
                {content}
            </div>
        )
    }

    return (
        <Link to={linkTo} className="bg-white dark:bg-neutral-800 border sm:shadow-sm dark:border-none rounded-lg overflow-auto flex flex-col gap-2 py-4">
            {content}
        </Link>
    )
}

export default NoteCard