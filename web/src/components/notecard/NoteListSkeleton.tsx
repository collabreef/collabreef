import { FC } from "react"
import NoteCardSkeleton from "./NoteCardSkeleton"

interface NoteListSkeletonProps {
    count?: number
}

const NoteListSkeleton: FC<NoteListSkeletonProps> = ({ count = 6 }) => {
    return (
        <div className="px-4 flex flex-col gap-2">
            {Array.from({ length: count }).map((_, idx) => (
                <NoteCardSkeleton key={idx} />
            ))}
        </div>
    )
}

export default NoteListSkeleton