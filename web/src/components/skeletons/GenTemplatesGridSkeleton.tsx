import { FC } from "react"
import GenTemplateCardSkeleton from "./GenTemplateCardSkeleton"

interface GenTemplatesGridSkeletonProps {
    count?: number
}

const GenTemplatesGridSkeleton: FC<GenTemplatesGridSkeletonProps> = ({ count = 6 }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: count }).map((_, idx) => (
                <GenTemplateCardSkeleton key={idx} />
            ))}
        </div>
    )
}

export default GenTemplatesGridSkeleton