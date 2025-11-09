import { FC } from "react"
import Masonry from "../masonry/Masonry"
import NoteCardSkeleton from "./NoteCardSkeleton"

interface NoteMasonrySkeletonProps {
    count?: number
}

const NoteMasonrySkeleton: FC<NoteMasonrySkeletonProps> = ({ count = 6 }) => {
    return (
        <Masonry>
            {Array.from({ length: count }).map((_, idx) => (
                <NoteCardSkeleton key={idx} />
            ))}
        </Masonry>
    )
}

export default NoteMasonrySkeleton