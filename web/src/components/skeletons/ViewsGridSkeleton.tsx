import { FC } from "react"
import ViewCardSkeleton from "./ViewCardSkeleton"

interface ViewsGridSkeletonProps {
    count?: number
}

const ViewsGridSkeleton: FC<ViewsGridSkeletonProps> = ({ count = 6 }) => {
    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, idx) => (
                <ViewCardSkeleton key={idx} />
            ))}
        </div>
    )
}

export default ViewsGridSkeleton