import { FC } from "react"

const FileCardSkeleton: FC = () => {
    return (
        <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-800 animate-pulse">
            {/* Thumbnail/Icon Area */}
            <div className="aspect-square relative bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-200 dark:bg-neutral-700 rounded"></div>
            </div>

            {/* File Info */}
            <div className="p-3">
                <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4 mb-2"></div>
                <div className="flex items-center justify-between">
                    <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-1/4"></div>
                    <div className="h-4 w-12 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="px-3 pb-3 flex gap-1">
                <div className="flex-1 h-7 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                <div className="flex-1 h-7 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                <div className="flex-1 h-7 bg-gray-200 dark:bg-neutral-700 rounded"></div>
            </div>
        </div>
    )
}

export default FileCardSkeleton