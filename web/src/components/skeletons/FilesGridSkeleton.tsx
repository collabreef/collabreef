import { FC } from "react"
import FileCardSkeleton from "./FileCardSkeleton"

interface FilesGridSkeletonProps {
    count?: number
}

const FilesGridSkeleton: FC<FilesGridSkeletonProps> = ({ count = 8 }) => {
    return (
        <div className="grid grid-cols-auto-fill-140 gap-4">
            {Array.from({ length: count }).map((_, idx) => (
                <FileCardSkeleton key={idx} />
            ))}
        </div>
    )
}

export default FilesGridSkeleton