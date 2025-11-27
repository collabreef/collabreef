import { useState, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Save } from "lucide-react"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { createGenTemplate, updateGenTemplate, getGenTemplate, listGenModels } from "@/api/gen-template"
import { Modality } from "@/types/gen-template"
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
    const [provider, setProvider] = useState("")
    const [model, setModel] = useState("")
    const [modality, setModality] = useState<Modality>("text2text")
    const [imageUrls, setImageUrls] = useState<string[]>([])
    const [_, setUploadingIndex] = useState<number | null>(null)

    // Fetch all available models
    const { data: allModels = [] } = useQuery({
        queryKey: ['gen-models', currentWorkspaceId],
        queryFn: () => listGenModels(currentWorkspaceId),
        enabled: !!currentWorkspaceId,
    })

    // Filter providers by selected modality and create provider info map
    const availableProviders = useMemo(() => {
        if (!modality) return []
        const providers = [...new Set(
            allModels
                .filter(m => m.modality === modality)
                .map(m => m.provider)
        )]
        return providers
    }, [allModels, modality])

    // Create a map of provider -> display name
    const providerDisplayNames = useMemo(() => {
        const map: Record<string, string> = {}
        allModels.forEach(m => {
            if (!map[m.provider]) {
                map[m.provider] = m.provider_display_name
            }
        })
        return map
    }, [allModels])

    // Filter models by selected provider and modality
    const availableModels = useMemo(() => {
        if (!provider || !modality) return []
        return allModels.filter(m => m.provider === provider && m.modality === modality)
    }, [allModels, provider, modality])

    const { data: existingTemplate, isLoading } = useQuery({
        queryKey: ['gen-template', currentWorkspaceId, id],
        queryFn: () => getGenTemplate(currentWorkspaceId, id!),
        enabled: !!isEdit && !!currentWorkspaceId && !!id,
    })

    useEffect(() => {
        if (existingTemplate) {
            setName(existingTemplate.name)
            setPrompt(existingTemplate.prompt)
            setModality(existingTemplate.modality)
            setProvider(existingTemplate.provider || "")
            setModel(existingTemplate.model)
            setImageUrls(existingTemplate.image_urls ? existingTemplate.image_urls.split(',').filter(Boolean) : [])
        }
    }, [existingTemplate])

    // Reset provider when modality changes
    useEffect(() => {
        if (!isEdit && modality) {
            setProvider("")
            setModel("")
        }
    }, [modality, isEdit])

    // Reset model when provider changes
    useEffect(() => {
        if (!isEdit && provider) {
            setModel("")
        }
    }, [provider, isEdit])

    // Auto-select first provider if only one available
    useEffect(() => {
        if (!isEdit && availableProviders.length === 1 && !provider) {
            setProvider(availableProviders[0])
        }
    }, [availableProviders, provider, isEdit])

    // Auto-select first model if only one available
    useEffect(() => {
        if (!isEdit && availableModels.length === 1 && !model) {
            setModel(availableModels[0].id)
        }
    }, [availableModels, model, isEdit])

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
            provider,
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
            provider,
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

    if (isEdit && isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>
    }

    return (
        <div className="p-4 xl:px-0 xl:pr-4 w-full">
            <div className="w-full max-w-3xl">
                <div className="flex items-center gap-3">
                    <button
                        aria-label="back"
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="text-2xl font-semibold">
                        {isEdit ? t("genTemplates.edit") : t("genTemplates.new")}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-4 lg:p-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t("genTemplates.fields.name")}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            aria-label="template name"
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
                            {t("genTemplates.fields.modality")}
                        </label>
                        <select
                            value={modality}
                            onChange={(e) => setModality(e.target.value as Modality)}
                            aria-label="modality"
                            className="w-full px-4 py-2 rounded-lg border dark:border-neutral-700 bg-white dark:bg-neutral-800"
                            required
                        >
                            <option value="text2text">Text to Text</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t("genTemplates.fields.provider")}
                        </label>
                        <select
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            aria-label="provider"
                            className="w-full px-4 py-2 rounded-lg border dark:border-neutral-700 bg-white dark:bg-neutral-800"
                            required
                            disabled={availableProviders.length === 0}
                        >
                            <option value="">{t("genTemplates.selectProvider") || "Select a provider"}</option>
                            {availableProviders.map(p => (
                                <option key={p} value={p}>
                                    {providerDisplayNames[p] || p}
                                </option>
                            ))}
                        </select>
                        {availableProviders.length === 0 && (
                            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                                {t("genTemplates.noProvidersAvailable") || "No providers available for this modality"}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">
                            {t("genTemplates.fields.model")}
                        </label>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            aria-label="model"
                            className="w-full px-4 py-2 rounded-lg border dark:border-neutral-700 bg-white dark:bg-neutral-800"
                            required
                            disabled={!provider || availableModels.length === 0}
                        >
                            <option value="">{t("genTemplates.selectModel") || "Select a model"}</option>
                            {availableModels.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.name} {m.description && `- ${m.description}`}
                                </option>
                            ))}
                        </select>
                        {provider && availableModels.length === 0 && (
                            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                                {t("genTemplates.noModelsAvailable") || "No models available for this provider and modality"}
                            </p>
                        )}
                    </div>


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
        </div>
    )
}

export default GenTemplateFormPage