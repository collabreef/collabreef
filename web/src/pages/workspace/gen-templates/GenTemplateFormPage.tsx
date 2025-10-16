import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Save, Upload, X } from "lucide-react"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { createGenTemplate, updateGenTemplate, getGenTemplate } from "@/api/gen-template"
import { uploadFile } from "@/api/file"
import { Modality } from "@/types/gen-template"
import TransitionWrapper from "@/components/transitionwrapper/TransitionWrapper"
import { useToastStore } from "@/stores/toast"

const GenTemplateFormPage = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { addToast } = useToastStore()
    const queryClient = useQueryClient()
    const isEdit = id && id !== 'new'

    const [name, setName] = useState("")
    const [prompt, setPrompt] = useState("")
    const [model, setModel] = useState("")
    const [modality, setModality] = useState<Modality>("text2text")
    const [imageUrls, setImageUrls] = useState<string[]>([])
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

    const { data: existingTemplate, isLoading } = useQuery({
        queryKey: ['gen-template', currentWorkspaceId, id],
        queryFn: () => getGenTemplate(currentWorkspaceId, id!),
        enabled: !!isEdit && !!currentWorkspaceId && !!id,
    })

    useEffect(() => {
        if (existingTemplate) {
            setName(existingTemplate.name)
            setPrompt(existingTemplate.prompt)
            setModel(existingTemplate.model)
            setModality(existingTemplate.modality)
            setImageUrls(existingTemplate.image_urls ? existingTemplate.image_urls.split(',').filter(Boolean) : [])
        }
    }, [existingTemplate])

    // Extract parameters from prompt using regex {{xxx}}
    // Support all Unicode letters, numbers, and underscores
    const parameters = useMemo(() => {
        const regex = /\{\{([\p{L}\p{N}_]+)\}\}/gu
        const matches = [...prompt.matchAll(regex)]
        const uniqueParams = [...new Set(matches.map(match => match[1]))]
        return uniqueParams
    }, [prompt])

    const createMutation = useMutation({
        mutationFn: () => createGenTemplate(currentWorkspaceId, {
            name,
            prompt,
            model,
            modality,
            image_urls: imageUrls.filter(Boolean).join(',')
        }),
        onSuccess: (data) => {
            addToast({ title: t("genTemplates.createSuccess"), type: "success" })
            queryClient.invalidateQueries({ queryKey: ['gen-templates', currentWorkspaceId] })
            navigate(`/workspaces/${currentWorkspaceId}/gen-templates/${data.id}`)
        },
        onError: () => {
            addToast({ title: t("genTemplates.createError"), type: "error" })
        }
    })

    const updateMutation = useMutation({
        mutationFn: () => updateGenTemplate(currentWorkspaceId, id!, {
            name,
            prompt,
            model,
            modality,
            image_urls: imageUrls.filter(Boolean).join(',')
        }),
        onSuccess: () => {
            addToast({ title: t("genTemplates.updateSuccess"), type: "success" })
            queryClient.invalidateQueries({ queryKey: ['gen-templates', currentWorkspaceId] })
            queryClient.invalidateQueries({ queryKey: ['gen-template', currentWorkspaceId, id] })
            navigate(`/workspaces/${currentWorkspaceId}/gen-templates/${id}`)
        },
        onError: () => {
            addToast({ title: t("genTemplates.updateError"), type: "error" })
        }
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (isEdit) {
            updateMutation.mutate()
        } else {
            createMutation.mutate()
        }
    }

    const handleFileUpload = async (file: File, index: number) => {
        try {
            setUploadingIndex(index)
            const result = await uploadFile(currentWorkspaceId, file)
            // Store the filename, not the full URL
            const newUrls = [...imageUrls]
            newUrls[index] = result.filename
            setImageUrls(newUrls)
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
        // If it's already a full URL (http/https), return as is
        if (filenameOrUrl.startsWith('http://') || filenameOrUrl.startsWith('https://')) {
            return filenameOrUrl
        }
        // If it's a relative path starting with /, return as is
        if (filenameOrUrl.startsWith('/')) {
            return filenameOrUrl
        }
        // Otherwise, it's a filename, construct the full path
        return `/api/v1/workspaces/${currentWorkspaceId}/files/${filenameOrUrl}`
    }

    if (isEdit && isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>
    }

    return (
        <TransitionWrapper className="w-full max-w-4xl mx-auto">
            <div className="py-4">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate(`/workspaces/${currentWorkspaceId}/gen-templates`)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-semibold">
                        {isEdit ? t("genTemplates.edit") : t("genTemplates.new")}
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t("genTemplates.fields.name")}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border dark:border-neutral-700 bg-white dark:bg-neutral-800"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t("genTemplates.fields.prompt")}
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border dark:border-neutral-700 bg-white dark:bg-neutral-800 min-h-[150px]"
                            placeholder={t("genTemplates.promptPlaceholder")}
                            required
                        />
                        {parameters.length > 0 && (
                            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <p className="text-sm font-medium mb-2">{t("genTemplates.detectedParameters")}:</p>
                                <div className="flex flex-wrap gap-2">
                                    {parameters.map(param => (
                                        <span key={param} className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-sm">
                                            {param}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t("genTemplates.fields.model")}
                        </label>
                        <input
                            type="text"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border dark:border-neutral-700 bg-white dark:bg-neutral-800"
                            placeholder="e.g., gpt-4, claude-3-opus"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t("genTemplates.fields.modality")}
                        </label>
                        <select
                            value={modality}
                            onChange={(e) => setModality(e.target.value as Modality)}
                            className="w-full px-4 py-2 rounded-lg border dark:border-neutral-700 bg-white dark:bg-neutral-800"
                            required
                        >
                            <option value="text2text">Text to Text</option>
                            <option value="text2image">Text to Image</option>
                            <option value="textimage2text">Text+Image to Text</option>
                            <option value="textimage2image">Text+Image to Image</option>
                        </select>
                    </div>

                    {(modality === 'textimage2text' || modality === 'textimage2image') && (
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t("genTemplates.fields.imageUrls")}
                            </label>
                            <div className="space-y-3">
                                {imageUrls.map((url, index) => (
                                    <div key={index} className="flex gap-2 items-start">
                                        {url && (
                                            <img
                                                src={getImageUrl(url)}
                                                alt={`Preview ${index + 1}`}
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
                                                    const newUrls = [...imageUrls]
                                                    newUrls[index] = e.target.value
                                                    setImageUrls(newUrls)
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
                                                        const newUrls = imageUrls.filter((_, i) => i !== index)
                                                        setImageUrls(newUrls)
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
                                    onClick={() => setImageUrls([...imageUrls, ""])}
                                    className="px-4 py-2 border dark:border-neutral-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    {t("genTemplates.addImageUrl")}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            {isEdit ? t("actions.update") : t("actions.create")}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`/workspaces/${currentWorkspaceId}/gen-templates`)}
                            className="px-6 py-2 border dark:border-neutral-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            {t("actions.cancel")}
                        </button>
                    </div>
                </form>
            </div>
        </TransitionWrapper>
    )
}

export default GenTemplateFormPage