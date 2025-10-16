import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { Trash2, ChevronDown, ChevronUp, Copy, ExternalLink, AlertCircle } from "lucide-react"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { deleteGenHistory } from "@/api/gen-template"
import { useToastStore } from "@/stores/toast"
import { GenHistory } from "@/types/gen-template"

interface GenHistoryCardProps {
    history: GenHistory
    onDeleted: () => void
}

const GenHistoryCard = ({ history, onDeleted }: GenHistoryCardProps) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { addToast } = useToastStore()
    const [isExpanded, setIsExpanded] = useState(false)

    const deleteMutation = useMutation({
        mutationFn: () => deleteGenHistory(currentWorkspaceId, history.id),
        onSuccess: () => {
            addToast({ title: t("genHistory.deleteSuccess") || "History deleted", type: "success" })
            onDeleted()
        },
        onError: () => {
            addToast({ title: t("genHistory.deleteError") || "Failed to delete history", type: "error" })
        }
    })

    const handleDelete = () => {
        if (window.confirm(t("genHistory.deleteConfirm") || "Are you sure you want to delete this history?")) {
            deleteMutation.mutate()
        }
    }

    const handleCopyContent = () => {
        navigator.clipboard.writeText(history.response_content)
        addToast({ title: t("messages.copied") || "Copied to clipboard", type: "success" })
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString()
    }

    const getImageUrl = (filenameOrUrl: string) => {
        if (!filenameOrUrl) return ""
        if (filenameOrUrl.startsWith('http://') || filenameOrUrl.startsWith('https://')) {
            return filenameOrUrl
        }
        if (filenameOrUrl.startsWith('/')) {
            return filenameOrUrl
        }
        return `/api/v1/workspaces/${currentWorkspaceId}/files/${filenameOrUrl}`
    }

    const imageUrls = history.request_image_urls ? history.request_image_urls.split(',').filter(Boolean) : []
    const hasError = !!history.response_error

    return (
        <div className="p-4 rounded-lg border dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                            {history.request_modality}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {history.request_model}
                        </span>
                        {hasError && (
                            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                                <AlertCircle size={12} />
                                Error
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(history.created_at)}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate(`/workspaces/${currentWorkspaceId}/gen-templates/${history.template_id}`)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        title={t("genHistory.viewTemplate") || "View template"}
                    >
                        <ExternalLink size={16} />
                    </button>
                    <button
                        onClick={handleCopyContent}
                        disabled={hasError}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
                        title={t("actions.copy") || "Copy"}
                    >
                        <Copy size={16} />
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg disabled:opacity-50"
                        title={t("actions.delete") || "Delete"}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {t("genHistory.prompt") || "Prompt"}
                    </h3>
                    <p className="text-sm line-clamp-2">
                        {history.request_prompt}
                    </p>
                </div>

                {imageUrls.length > 0 && (
                    <div>
                        <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            {t("genHistory.images") || "Images"}
                        </h3>
                        <div className="flex gap-2 overflow-x-auto">
                            {imageUrls.map((img, index) => (
                                <img
                                    key={index}
                                    src={getImageUrl(img)}
                                    alt={`Image ${index + 1}`}
                                    className="w-16 h-16 object-cover rounded border dark:border-neutral-700"
                                    onError={(e) => {
                                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EError%3C/text%3E%3C/svg%3E'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <div className="flex justify-between items-center mb-1">
                        <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {hasError ? t("genHistory.error") || "Error" : t("genHistory.response") || "Response"}
                        </h3>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                            {isExpanded ? (
                                <>
                                    {t("actions.showLess") || "Show less"}
                                    <ChevronUp size={14} />
                                </>
                            ) : (
                                <>
                                    {t("actions.showMore") || "Show more"}
                                    <ChevronDown size={14} />
                                </>
                            )}
                        </button>
                    </div>
                    <div className={`p-3 rounded-lg ${hasError ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-900 border dark:border-neutral-700'}`}>
                        <pre className={`whitespace-pre-wrap text-sm ${isExpanded ? '' : 'line-clamp-3'}`}>
                            {hasError ? history.response_error : history.response_content}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GenHistoryCard