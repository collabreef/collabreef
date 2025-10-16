import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Edit, Sparkles, Trash2, Upload, X } from "lucide-react"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { getGenTemplate, deleteGenTemplate } from "@/api/gen-template"
import { uploadFile } from "@/api/file"
import TransitionWrapper from "@/components/transitionwrapper/TransitionWrapper"
import { useToastStore } from "@/stores/toast"

const GenTemplateDetailPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { addToast } = useToastStore()
    const queryClient = useQueryClient()

    const [paramValues, setParamValues] = useState<Record<string, string>>({})
    const [assembledPrompt, setAssembledPrompt] = useState("")
    const [additionalImageUrls, setAdditionalImageUrls] = useState<string[]>([])
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

    const { data: template, isLoading } = useQuery({
        queryKey: ['gen-template', currentWorkspaceId, id],
        queryFn: () => getGenTemplate(currentWorkspaceId, id!),
        enabled: !!currentWorkspaceId && !!id,
    })

    // Extract parameters from prompt using regex {{xxx}}
    // Support all Unicode letters, numbers, and underscores
    const parameters = useMemo(() => {
        if (!template) return []
        const regex = /\{\{([\p{L}\p{N}_]+)\}\}/gu
        const matches = [...template.prompt.matchAll(regex)]
        const uniqueParams = [...new Set(matches.map(match => match[1]))]
        return uniqueParams
    }, [template])

    // Initialize parameter values
    useEffect(() => {
        if (parameters.length > 0) {
            const initialValues: Record<string, string> = {}
            parameters.forEach(param => {
                initialValues[param] = paramValues[param] || ""
            })
            setParamValues(initialValues)
        }
    }, [parameters])

    // Assemble prompt with parameter values
    useEffect(() => {
        if (template) {
            let assembled = template.prompt
            Object.entries(paramValues).forEach(([key, value]) => {
                assembled = assembled.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
            })
            setAssembledPrompt(assembled)
        }
    }, [template, paramValues])

    const deleteMutation = useMutation({
        mutationFn: () => deleteGenTemplate(currentWorkspaceId, id!),
        onSuccess: () => {
            addToast({ title: t("genTemplates.deleteSuccess"), type: "success" })
            queryClient.invalidateQueries({ queryKey: ['gen-templates', currentWorkspaceId] })
            navigate(`/workspaces/${currentWorkspaceId}/gen-templates`)
        },
        onError: () => {
            addToast({ title: t("genTemplates.deleteError"), type: "error" })
        }
    })

    const handleDelete = () => {
        if (window.confirm(t("genTemplates.deleteConfirm"))) {
            deleteMutation.mutate()
        }
    }

    const handleGenerate = () => {
        // This is where you would call the AI generation API
        // For now, just show the assembled prompt
        addToast({ title: t("genTemplates.generatePlaceholder"), type: "info" })
        console.log("Assembled prompt:", assembledPrompt)
        console.log("Model:", template?.model)
        console.log("Modality:", template?.modality)
        console.log("Template Images:", templateImages)
        console.log("Additional Images:", additionalImageUrls.filter(Boolean))
    }

    const handleFileUpload = async (file: File, index: number) => {
        try {
            setUploadingIndex(index)
            const result = await uploadFile(currentWorkspaceId, file)
            const newUrls = [...additionalImageUrls]
            newUrls[index] = result.filename
            setAdditionalImageUrls(newUrls)
            addToast({ title: t("messages.fileUploaded") || "File uploaded", type: "success" })
        } catch (error) {
            addToast({ title: t("messages.fileUploadFailed") || "File upload failed", type: "error" })
        } finally {
            setUploadingIndex(null)
        }
    }

    // Helper function to get full image URL from filename
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

    // Parse template images
    const templateImages = useMemo(() => {
        if (!template?.image_urls) return []
        return template.image_urls.split(',').filter(Boolean)
    }, [template?.image_urls])

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>
    }

    if (!template) {
        return <div className="flex justify-center items-center h-screen">Template not found</div>
    }

    return (
        <TransitionWrapper className="w-full max-w-4xl mx-auto">
            <div className="py-4">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(`/workspaces/${currentWorkspaceId}/gen-templates`)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl font-semibold">{template.name}</h1>
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {template.modality}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(`/workspaces/${currentWorkspaceId}/gen-templates/${id}/edit`)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                            <Edit size={18} />
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleteMutation.isPending}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg disabled:opacity-50"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            {t("genTemplates.fields.model")}
                        </h2>
                        <p className="text-lg">{template.model}</p>
                    </div>

                    <div>
                        <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            {t("genTemplates.fields.prompt")}
                        </h2>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border dark:border-neutral-700">
                            <pre className="whitespace-pre-wrap text-sm">{template.prompt}</pre>
                        </div>
                    </div>

                    {(template.modality === 'textimage2text' || template.modality === 'textimage2image') && templateImages.length > 0 && (
                        <div>
                            <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                {t("genTemplates.fields.imageUrls")}
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {templateImages.map((img, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={getImageUrl(img)}
                                            alt={`Template image ${index + 1}`}
                                            className="w-full h-32 object-cover rounded-lg border dark:border-neutral-700"
                                            onError={(e) => {
                                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EError%3C/text%3E%3C/svg%3E'
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {parameters.length > 0 && (
                        <div>
                            <h2 className="text-lg font-semibold mb-4">{t("genTemplates.fillParameters")}</h2>
                            <div className="space-y-4">
                                {parameters.map(param => (
                                    <div key={param}>
                                        <label className="block text-sm font-medium mb-2">
                                            {param}
                                        </label>
                                        <input
                                            type="text"
                                            value={paramValues[param] || ""}
                                            onChange={(e) => setParamValues(prev => ({
                                                ...prev,
                                                [param]: e.target.value
                                            }))}
                                            className="w-full px-4 py-2 rounded-lg border dark:border-neutral-700 bg-white dark:bg-neutral-800"
                                            placeholder={`Enter value for ${param}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {parameters.length > 0 && (
                        <div>
                            <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                {t("genTemplates.assembledPrompt")}
                            </h2>
                            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                <pre className="whitespace-pre-wrap text-sm">{assembledPrompt}</pre>
                            </div>
                        </div>
                    )}

                    {(template.modality === 'textimage2text' || template.modality === 'textimage2image') && (
                        <div>
                            <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                {t("genTemplates.additionalImages") || "Additional Images"}
                            </h2>
                            <div className="space-y-3">
                                {additionalImageUrls.map((url, index) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        {url && (
                                            <img
                                                src={getImageUrl(url)}
                                                alt={`Additional ${index + 1}`}
                                                className="w-20 h-20 object-cover rounded border dark:border-neutral-700"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none'
                                                }}
                                            />
                                        )}
                                        <div className="flex-1 flex flex-col gap-2">
                                            <input
                                                type="text"
                                                value={url}
                                                onChange={(e) => {
                                                    const newUrls = [...additionalImageUrls]
                                                    newUrls[index] = e.target.value
                                                    setAdditionalImageUrls(newUrls)
                                                }}
                                                className="w-full px-4 py-2 rounded-lg border dark:border-neutral-700 bg-white dark:bg-neutral-800"
                                                placeholder={t("genTemplates.imageUrlPlaceholder")}
                                            />
                                            <div className="flex gap-2">
                                                <label className="flex items-center gap-2 px-4 py-2 border dark:border-neutral-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                                                    <Upload size={16} />
                                                    {uploadingIndex === index ? "Uploading..." : t("actions.selectFileToUpload")}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        disabled={uploadingIndex === index}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) {
                                                                handleFileUpload(file, index)
                                                            }
                                                        }}
                                                    />
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newUrls = additionalImageUrls.filter((_, i) => i !== index)
                                                        setAdditionalImageUrls(newUrls)
                                                    }}
                                                    className="px-4 py-2 border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setAdditionalImageUrls([...additionalImageUrls, ""])}
                                    className="px-4 py-2 border dark:border-neutral-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    {t("genTemplates.addImageUrl")}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleGenerate}
                            disabled={parameters.some(param => !paramValues[param])}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            <Sparkles size={18} />
                            {t("genTemplates.generate")}
                        </button>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-500 pt-2">
                        {t("genTemplates.generationNotice")}
                    </div>
                </div>
            </div>
        </TransitionWrapper>
    )
}

export default GenTemplateDetailPage