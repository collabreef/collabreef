import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ViewObject } from "@/types/view"
import ViewObjectDataDisplay from "./ViewObjectDataDisplay"
import { Link } from "react-router-dom"

interface ViewObjectDetailBaseProps {
    viewName: string
    viewObject: ViewObject | null
    isLoading: boolean
    onBack: () => void
    notFoundMessage: string
    children: ReactNode
    headerAction?: ReactNode
}

const ViewObjectDetailBase = ({
    viewName,
    viewObject,
    isLoading,
    onBack,
    notFoundMessage,
    children,
    headerAction
}: ViewObjectDetailBaseProps) => {
    const { t } = useTranslation()

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                {t('common.loading')}
            </div>
        )
    }

    if (!viewObject) {
        return (
            <div className="flex flex-col justify-center items-center h-screen">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {notFoundMessage}
                </p>
                <button
                    onClick={onBack}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    {t('common.back')}
                </button>
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen bg-neutral-100 dark:bg-neutral-900">
            <div className="px-4 pt-4 z-10">
                <Link
                    to="../"
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors mb-3"
                >
                    {viewName}
                </Link>
                <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold truncate">{viewObject.name}</div>
                        {viewObject.data && (
                            <ViewObjectDataDisplay viewObject={viewObject} variant="detail" />
                        )}
                    </div>
                    {headerAction && (
                        <div className="flex-shrink-0">
                            {headerAction}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 pt-0 overflow-x-hidden">
                <div>{children}</div>
            </div>
        </div>
    )
}

export default ViewObjectDetailBase