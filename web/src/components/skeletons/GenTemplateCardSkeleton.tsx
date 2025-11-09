import { FC } from "react"

const GenTemplateCardSkeleton: FC = () => {
    return (
        <div className="p-4 rounded-lg border dark:border-neutral-700 bg-white dark:bg-neutral-800 animate-pulse">
            <div className="flex justify-between items-start mb-2">
                <div className="h-6 bg-gray-200 dark:bg-neutral-700 rounded w-2/3"></div>
                <div className="h-5 w-16 bg-gray-200 dark:bg-neutral-700 rounded"></div>
            </div>
            <div className="space-y-2 mb-2">
                <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-4/5"></div>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-1/3"></div>
        </div>
    )
}

export default GenTemplateCardSkeleton