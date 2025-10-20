import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2, ChevronDown, ChevronUp, Copy, Check } from "lucide-react"
import { GenHistory } from "@/types/gen-template"
import { deleteGenHistory } from "@/api/gen-template"
import { useToastStore } from "@/stores/toast"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"

interface GenHistoryCardProps {
    history: GenHistory
    onDeleted?: () => void
}

const GenHistoryCard = ({ history, onDeleted }: GenHistoryCardProps) => {
    const { t } = useTranslation()
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { addToast } = useToastStore()
    const queryClient = useQueryClient()
    const [isExpanded, setIsExpanded] = useState(false)
    const [isCopied, setIsCopied] = useState(false)

    const deleteMutation = useMutation({
        mutationFn: () => deleteGenHistory(currentWorkspaceId, history.id),
        onSuccess: () => {
            addToast({ title: t("genHistory.deleteSuccess") || "History deleted", type: "success" })
            queryClient.invalidateQueries({ queryKey: ['gen-histories', currentWorkspaceId, history.template_id] })
            onDeleted?.()
        },
        onError: () => {
            addToast({ title: t("genHistory.deleteError") || "Failed to delete history", type: "error" })
        }
    })

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (window.confirm(t("genHistory.deleteConfirm") || "Are you sure you want to delete this history?")) {
            deleteMutation.mutate()
        }
    }

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await navigator.clipboard.writeText(history.response_content)
            setIsCopied(true)
            addToast({ title: t("messages.copied") || "Copied to clipboard", type: "success" })
            setTimeout(() => setIsCopied(false), 2000)
        } catch (error) {
            addToast({ title: t("messages.copyFailed") || "Failed to copy", type: "error" })
        }
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

    const requestImages = history.request_image_urls
        ? history.request_image_urls.split(',').filter(Boolean)
        : []

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString()
    }

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-700 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors"
            >
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                            {history.request_modality}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(history.created_at)}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                        {history.request_prompt}
                    </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </button>

            {isExpanded && (
                <div className="p-4 space-y-3 border-t dark:border-neutral-700">
                    <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {t("genHistory.model") || "Model"}
                        </div>
                        <p className="text-sm">{history.request_model}</p>
                    </div>

                    <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {t("genHistory.prompt") || "Prompt"}
                        </div>
                        <div className="p-2 rounded bg-gray-50 dark:bg-neutral-900 border dark:border-neutral-700">
                            <pre className="text-xs whitespace-pre-wrap">{history.request_prompt}</pre>
                        </div>
                    </div>

                    {requestImages.length > 0 && (
                        <div>
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                {t("genHistory.images") || "Images"}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {requestImages.map((img, index) => (
                                    <img
                                        key={index}
                                        src={getImageUrl(img)}
                                        alt={`Request image ${index + 1}`}
                                        className="w-full h-20 object-cover rounded border dark:border-neutral-700"
                                        onError={(e) => {
                                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EError%3C/text%3E%3C/svg%3E'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {history.response_error ? t("genHistory.error") || "Error" : t("genHistory.response") || "Response"}
                            </div>
                            {!history.response_error && (
                                <button
                                    onClick={handleCopy}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                    title={t("actions.copy") || "Copy"}
                                >
                                    {isCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                                </button>
                            )}
                        </div>
                        <div className={`p-2 rounded border ${history.response_error ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700'}`}>
                            <pre className="text-xs whitespace-pre-wrap">
                                {history.response_error || history.response_content}
                            </pre>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg disabled:opacity-50 transition-colors"
                        >
                            <Trash2 size={14} />
                            {t("actions.delete") || "Delete"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default GenHistoryCard