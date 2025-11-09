import { FC } from "react"

const ViewCardSkeleton: FC = () => {
    return (
        <div className="p-4 border dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 animate-pulse">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-5 h-5 bg-gray-200 dark:bg-neutral-700 rounded flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                        <div className="h-5 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-1/2"></div>
                    </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                    <div className="w-6 h-6 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                    <div className="w-6 h-6 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                </div>
            </div>
            <div className="mt-3 space-y-1">
                <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-2/3"></div>
            </div>
        </div>
    )
}

export default ViewCardSkeleton