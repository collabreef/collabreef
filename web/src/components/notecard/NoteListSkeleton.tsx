import { FC } from "react"
import NoteCardSkeleton from "./NoteCardSkeleton"

interface NoteListSkeletonProps {
    count?: number
}

const NoteListSkeleton: FC<NoteListSkeletonProps> = ({ count = 6 }) => {
    return (
        <div className="flex flex-col gap-3 max-w-3xl m-auto">
            {Array.from({ length: count }).map((_, idx) => (
                <NoteCardSkeleton key={idx} />
            ))}
        </div>
    )
}

export default NoteListSkeleton