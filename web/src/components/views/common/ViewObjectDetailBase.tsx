import { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ViewObject } from "@/types/view"
import ViewObjectDataDisplay from "./ViewObjectDataDisplay"

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
    viewObject,
    isLoading,
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
            </div>
        )
    }

    return (
        <div className="w-full min-h-screen bg-neutral-100 dark:bg-neutral-900">
            <div className="px-4 pt-4 z-10">

                <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        {viewObject.data && (
                            <ViewObjectDataDisplay viewObject={viewObject} />
                        )}
                        <div className="text-sm  truncate">{viewObject.name}</div>
                    </div>
                    {headerAction && (
                        <div className="flex-shrink-0">
                            {headerAction}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 overflow-x-hidden">
                <div>{children}</div>
            </div>
        </div>
    )
}

export default ViewObjectDetailBase