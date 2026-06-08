import { FC } from "react"

const NoteCardSkeleton: FC = () => {
    return (
        <div className="bg-white dark:bg-neutral-800 border sm:shadow-sm dark:border-none rounded-lg overflow-auto flex flex-col gap-2 p-4 animate-pulse">
            <div className="flex justify-between text-gray-500">
                <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-700 rounded"></div>
            </div>
            <div className="break-all w-full flex flex-col m-auto gap-2">
                <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-5/6"></div>
            </div>
        </div>
    )
}

export default NoteCardSkeleton