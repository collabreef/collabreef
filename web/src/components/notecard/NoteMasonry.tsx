import { FC } from "react"
import Masonry from "../masonry/Masonry"
import NoteCard from "./NoteCard"
import { NoteData } from "../../api/note"

interface NoteMasonryProps {
    notes: NoteData[]
    getLinkTo?: (note: NoteData) => string
    showLink?: boolean
}

const NoteMasonry: FC<NoteMasonryProps> = ({ notes, getLinkTo, showLink = true }) => {
    return (
        <Masonry>
            {notes?.map((note: NoteData, idx: number) => {
                if (!note) return null
                return (
                    <NoteCard
                        key={note.id || idx}
                        note={note}
                        linkTo={getLinkTo ? getLinkTo(note) : undefined}
                        showLink={showLink}
                    />
                )
            })}
        </Masonry>
    )
}

export default NoteMasonry