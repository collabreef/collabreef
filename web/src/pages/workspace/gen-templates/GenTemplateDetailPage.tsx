import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Edit, Sparkles, Trash2, Upload, X, History, ChevronRight } from "lucide-react"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { getGenTemplate, deleteGenTemplate, generateFromTemplate, getGenHistories } from "@/api/gen-template"
import { uploadFile } from "@/api/file"
import { useToastStore } from "@/stores/toast"
import { TwoColumn, TwoColumnMain, TwoColumnSidebar, useTwoColumn } from "@/components/twocolumn"
import GenHistoryCard from "@/components/genhistorycard/GenHistoryCard"

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

    const { data: histories, refetch: refetchHistories } = useQuery({
        queryKey: ['gen-histories', currentWorkspaceId, id],
        queryFn: () => getGenHistories(currentWorkspaceId, 1, 20, id),
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

    const generateMutation = useMutation({
        mutationFn: () => generateFromTemplate(currentWorkspaceId, {
            template_id: id!,
            prompt: assembledPrompt,
            image_urls: additionalImageUrls.filter(Boolean)
        }),
        onSuccess: (data) => {
            if (data.error) {
                addToast({ title: t("genTemplates.generateError") || "Generation failed", type: "error" })
                console.error("Generation error:", data.error)
            } else {
                addToast({ title: t("genTemplates.generateSuccess") || "Generated successfully", type: "success" })
                console.log("Generated content:", data.content)
                console.log("History ID:", data.history_id)
                refetchHistories()
            }
        },
        onError: (error) => {
            addToast({ title: t("genTemplates.generateError") || "Generation failed", type: "error" })
            console.error("Generation error:", error)
        }
    })

    const handleGenerate = () => {
        generateMutation.mutate()
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
        <TwoColumn>
            <TwoColumnMain
                className="bg-white dark:bg-neutral-800 "
            >
                <GenTemplateContent
                    template={template}
                    parameters={parameters}
                    paramValues={paramValues}
                    setParamValues={setParamValues}
                    assembledPrompt={assembledPrompt}
                    templateImages={templateImages}
                    additionalImageUrls={additionalImageUrls}
                    setAdditionalImageUrls={setAdditionalImageUrls}
                    uploadingIndex={uploadingIndex}
                    handleFileUpload={handleFileUpload}
                    getImageUrl={getImageUrl}
                    generateMutation={generateMutation}
                    handleGenerate={handleGenerate}
                    handleDelete={handleDelete}
                    deleteMutation={deleteMutation}
                    navigate={navigate}
                    currentWorkspaceId={currentWorkspaceId}
                    id={id}
                    t={t}
                />
            </TwoColumnMain>

            <TwoColumnSidebar className="bg-white">
                <GenTemplateSidebar
                    histories={histories}
                    refetchHistories={refetchHistories}
                    t={t}
                    isGenerating={generateMutation.isPending}
                />
            </TwoColumnSidebar>
        </TwoColumn>
    )
}

// Skeleton component for loading state
const GenHistorySkeleton = () => {
    return (
        <div className="bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-700 overflow-hidden animate-pulse">
            <div className="px-4 py-3">
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 w-20 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                    <div className="h-4 w-32 bg-gray-200 dark:bg-neutral-700 rounded"></div>
                </div>
                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4"></div>
                </div>
            </div>
        </div>
    )
}

// Sidebar component
const GenTemplateSidebar = ({ histories, refetchHistories, t, isGenerating }: any) => {
    const { toggleSidebar } = useTwoColumn()

    return (
        <div className="w-full h-full overflow-auto bg-neutral-100 dark:bg-neutral-900">
            <div className=" p-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                    <History size={18} />
                    <div className="text-lg font-semibold">{t("genHistory.title") || "Generation History"}</div>
                </div>
                <button
                    onClick={toggleSidebar}
                    className="lg:hidden p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg"
                    title="Hide History"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            <div className="px-4 pb-4 space-y-4">
                {isGenerating && <GenHistorySkeleton />}
                {histories && histories.length > 0 ? (
                    histories.map((history: any) => (
                        <GenHistoryCard
                            key={history.id}
                            history={history}
                            onDeleted={refetchHistories}
                        />
                    ))
                ) : (
                    !isGenerating && (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <History size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="text-sm">{t("genHistory.noHistory") || "No generation history yet"}</p>
                            <p className="text-xs mt-2">{t("genHistory.generateToSee") || "Generate content to see history here"}</p>
                        </div>
                    )
                )}
            </div>
        </div>
    )
}

// Main content component
const GenTemplateContent = ({ template, parameters, paramValues, setParamValues, assembledPrompt, templateImages, additionalImageUrls, setAdditionalImageUrls, uploadingIndex, handleFileUpload, getImageUrl, generateMutation, handleGenerate, handleDelete, deleteMutation, navigate, currentWorkspaceId, id, t }: any) => {
    const { isSidebarCollapsed, toggleSidebar } = useTwoColumn()

    return (
        <div className="p-2 w-full ">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/workspaces/${currentWorkspaceId}/gen-templates`)}
                        aria-label="back"
                        className="xl:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="hidden lg:flex items-center gap-2">
                        <span className="text-2xl font-semibold">{template.name}</span>
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {template.modality}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        title={isSidebarCollapsed ? "Show History" : "Hide History"}
                    >
                        <History size={18} />
                    </button>
                    <button
                        aria-label="edit template"
                        onClick={() => navigate(`/workspaces/${currentWorkspaceId}/gen-templates/${id}/edit`)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        <Edit size={18} />
                    </button>
                    <button
                        aria-label="delete template"
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 rounded-lg disabled:opacity-50"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-6 p-4 lg:p-6">
                <div className="lg:hidden flex items-center gap-2">
                    <span className="text-2xl font-semibold">{template.name}</span>
                    <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {template.modality}
                    </span>
                </div>
                <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {t("genTemplates.fields.model")}
                    </div>
                    <p className="text-lg">{template.model}</p>
                </div>

                <div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {t("genTemplates.fields.prompt")}
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border dark:border-neutral-700">
                        <pre className="whitespace-pre-wrap text-sm">{template.prompt}</pre>
                    </div>
                </div>

                {(template.modality === 'textimage2text' || template.modality === 'textimage2image') && templateImages.length > 0 && (
                    <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            {t("genTemplates.fields.imageUrls")}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {templateImages.map((img: string, index: number) => (
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
                        <div className="text-lg font-semibold mb-4">{t("genTemplates.fillParameters")}</div>
                        <div className="space-y-4">
                            {parameters.map((param: any) => (
                                <div key={param}>
                                    <label className="block text-sm font-medium mb-2">
                                        {param}
                                    </label>
                                    <input
                                        type="text"
                                        value={paramValues[param] || ""}
                                        onChange={(e) => setParamValues((prev: any) => ({
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
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            {t("genTemplates.assembledPrompt")}
                        </div>
                        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                            <pre className="whitespace-pre-wrap text-sm">{assembledPrompt}</pre>
                        </div>
                    </div>
                )}

                {(template.modality === 'textimage2text' || template.modality === 'textimage2image') && (
                    <div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                            {t("genTemplates.additionalImages") || "Additional Images"}
                        </div>
                        <div className="space-y-3">
                            {additionalImageUrls.map((url: string, index: number) => (
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
                                                    const newUrls = additionalImageUrls.filter((_: any, i: number) => i !== index)
                                                    setAdditionalImageUrls(newUrls)
                                                }}
                                                aria-label="add image"
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
                        disabled={parameters.some((param: any) => !paramValues[param]) || generateMutation.isPending}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                        <Sparkles size={18} />
                        {generateMutation.isPending ? t("genTemplates.generating") || "Generating..." : t("genTemplates.generate")}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default GenTemplateDetailPage