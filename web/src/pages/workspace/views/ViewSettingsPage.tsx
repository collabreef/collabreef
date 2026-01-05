import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import SidebarButton from "@/components/sidebar/SidebarButton"
import { Loader, RotateCcw, Trash2 } from "lucide-react"
import OneColumn from "@/components/onecolumn/OneColumn"
import { getView, updateView, deleteView } from "@/api/view"
import { useToastStore } from "@/stores/toast"
import VisibilitySelect from "@/components/visibilityselect/VisibilitySelect"
import { UpdateViewRequest } from "@/types/view"

const ViewSettingsPage = () => {
    const navigate = useNavigate()
    const { workspaceId, viewId, viewType } = useParams<{ workspaceId: string; viewId: string; viewType: string }>()
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { addToast } = useToastStore()

    const [viewName, setViewName] = useState("")
    const [visibility, setVisibility] = useState("private")
    const [isRenaming, setIsRenaming] = useState(false)

    const { data: view, isLoading } = useQuery({
        queryKey: ['view', workspaceId, viewId],
        queryFn: () => getView(workspaceId!, viewId!),
        enabled: !!workspaceId && !!viewId,
    })

    useEffect(() => {
        if (view) {
            setViewName(view.name)
            setVisibility(view.visibility || "private")
        }
    }, [view])

    const renameViewMutation = useMutation({
        mutationFn: () => updateView(workspaceId!, viewId!, { name: viewName }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['view', workspaceId, viewId] })
            queryClient.invalidateQueries({ queryKey: ['views', workspaceId] })
            queryClient.invalidateQueries({ queryKey: ['views', workspaceId, viewType] })
            setTimeout(() => {
                setIsRenaming(false)
            }, 200)
            addToast({ type: 'success', title: t('views.nameUpdated') || 'Name updated' })
        },
        onError: () => {
            addToast({ type: 'error', title: t('views.nameUpdateError') || 'Failed to update name' })
        }
    })

    const visibilityMutation = useMutation({
        mutationFn: (newVisibility: string) =>
            updateView(workspaceId!, viewId!, { visibility: newVisibility } as UpdateViewRequest),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['view', workspaceId, viewId] })
            queryClient.invalidateQueries({ queryKey: ['views', workspaceId] })
            queryClient.invalidateQueries({ queryKey: ['views', workspaceId, viewType] })
            addToast({ type: 'success', title: t('views.visibilityUpdated') || 'Visibility updated' })
        },
        onError: () => {
            addToast({ type: 'error', title: t('views.visibilityUpdateError') || 'Failed to update visibility' })
        }
    })

    const deleteViewMutation = useMutation({
        mutationFn: () => deleteView(workspaceId!, viewId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['views', workspaceId] })
            queryClient.invalidateQueries({ queryKey: ['views', workspaceId, viewType] })
            addToast({ type: 'success', title: t('views.viewDeleted') || 'View deleted' })
            navigate(`/workspaces/${workspaceId}/${viewType}`)
        },
        onError: () => {
            addToast({ type: 'error', title: t('views.deleteError') || 'Failed to delete view' })
        }
    })

    const handleRenameClick = () => {
        if (viewName.trim() && viewName !== view?.name) {
            setIsRenaming(true)
            renameViewMutation.mutate()
        }
    }

    const handleVisibilityChange = (newVisibility: string) => {
        if (newVisibility !== visibility) {
            setVisibility(newVisibility)
            visibilityMutation.mutate(newVisibility)
        }
    }

    const handleDeleteClick = () => {
        if (confirm(t('views.deleteConfirm'))) {
            deleteViewMutation.mutate()
        }
    }

    const getViewTypeLabel = () => {
        switch (viewType) {
            case 'calendar':
                return t('views.calendar')
            case 'map':
                return t('views.map')
            case 'kanban':
                return t('views.kanban') || 'Kanban'
            case 'flow':
                return t('views.flow')
            default:
                return viewType
        }
    }

    if (isLoading) {
        return (
            <OneColumn>
                <div className="w-full h-screen flex items-center justify-center">
                    <Loader className="animate-spin" size={32} />
                </div>
            </OneColumn>
        )
    }

    if (!view) {
        return (
            <OneColumn>
                <div className="w-full h-screen flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-gray-500">{t('views.viewNotFound') || 'View not found'}</p>
                    </div>
                </div>
            </OneColumn>
        )
    }

    return (
        <OneColumn>
            <div className="w-full">
                <div className="flex flex-col min-h-screen">
                    <div className="py-2.5 flex items-center justify-between">
                        <div className="flex gap-3 items-center sm:text-xl font-semibold h-10">
                            <SidebarButton />
                            {getViewTypeLabel()} {t('views.settings') || 'Settings'}
                        </div>
                    </div>
                    <div className="grow flex justify-start">
                        <div className="flex-1">
                            <div className="w-full">
                                <div className="bg-white dark:bg-neutral-800 rounded shadow-sm w-full p-5 max-w-3xl">
                                    <div className="flex flex-col gap-6">
                                        {/* View Name */}
                                        <div className="flex flex-col gap-2">
                                            <div className="text-lg font-semibold">
                                                {t('views.viewName') || 'View Name'}
                                            </div>
                                            <div className="flex gap-3 flex-wrap">
                                                <input
                                                    className="flex-1 px-3 py-2 border dark:border-none rounded-lg dark:bg-neutral-700"
                                                    value={viewName}
                                                    onChange={e => setViewName(e.target.value)}
                                                    title="rename view"
                                                />
                                                <button
                                                    onClick={handleRenameClick}
                                                    className="px-3 py-2 flex gap-2 items-center text-neutral-600 dark:text-neutral-300"
                                                    disabled={isRenaming || viewName.trim() === view.name}
                                                >
                                                    {isRenaming ? (
                                                        <Loader size={16} className="animate-spin" />
                                                    ) : (
                                                        <>
                                                            <RotateCcw size={16} />
                                                            {t("actions.rename")}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Visibility */}
                                        <div className="flex flex-col gap-2">
                                            <div className="text-lg font-semibold">
                                                {t('common.visibility') || 'Visibility'}
                                            </div>
                                            <div>
                                                <VisibilitySelect
                                                    value={visibility}
                                                    onChange={handleVisibilityChange}
                                                />
                                            </div>
                                        </div>

                                        {/* Delete View */}
                                        <div className="flex gap-2 items-center justify-between">
                                            <div className="flex flex-col">
                                                <div className="text-lg font-semibold">
                                                    {t('views.deleteView') || 'Delete View'}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {t('views.deleteViewWarning') || 'This action cannot be undone'}
                                                </div>
                                            </div>
                                            <div>
                                                <button
                                                    onClick={handleDeleteClick}
                                                    className="p-3 text-red-500 flex items-center gap-2"
                                                    aria-label="delete"
                                                    disabled={deleteViewMutation.isPending}
                                                >
                                                    {deleteViewMutation.isPending ? (
                                                        <Loader size={16} className="animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Trash2 size={16} />
                                                            {t("actions.delete")}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </OneColumn>
    )
}

export default ViewSettingsPage
