import { Plus, Trash2, MapPin, Calendar, PlusCircle } from "lucide-react"
import SidebarButton from "@/components/sidebar/SidebarButton"
import { getViews, createView, deleteView } from "@/api/view"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import TransitionWrapper from "@/components/transitionwrapper/TransitionWrapper"
import OneColumn from "@/components/onecolumn/OneColumn"
import { ViewType } from "@/types/view"
import { useToastStore } from "@/stores/toast"

const ViewsPage = () => {
    const { t } = useTranslation()
    const currentWorkspaceId = useCurrentWorkspaceId();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { addToast } = useToastStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newViewName, setNewViewName] = useState("");
    const [newViewType, setNewViewType] = useState<ViewType>("map");

    const {
        data: views,
        isLoading,
    } = useQuery({
        queryKey: ['views', currentWorkspaceId],
        queryFn: () => getViews(currentWorkspaceId),
        enabled: !!currentWorkspaceId,
    })

    const viewsList = views ?? []

    const createMutation = useMutation({
        mutationFn: (data: { name: string, type: ViewType }) =>
            createView(currentWorkspaceId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['views', currentWorkspaceId] });
            setIsCreating(false);
            setNewViewName("");
            setNewViewType("map");
            addToast({ type: 'success', title: t('views.objectCreatedSuccess') });
        },
        onError: () => {
            addToast({ type: 'error', title: t('views.objectCreatedError') });
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (viewId: string) => deleteView(currentWorkspaceId, viewId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['views', currentWorkspaceId] });
            addToast({ type: 'success', title: t('views.objectDeletedSuccess') });
        },
        onError: () => {
            addToast({ type: 'error', title: t('views.objectDeletedError') });
        }
    })

    const handleCreateView = () => {
        if (newViewName.trim()) {
            createMutation.mutate({ name: newViewName.trim(), type: newViewType });
        }
    }

    const handleDeleteView = (e: React.MouseEvent, viewId: string) => {
        e.stopPropagation(); // Prevent card click event
        if (window.confirm(t('views.deleteConfirm'))) {
            deleteMutation.mutate(viewId);
        }
    }

    const handleViewClick = (view: any) => {
        navigate(`/workspaces/${currentWorkspaceId}/views/${view.id}`);
    }

    return (
        <OneColumn>
            <TransitionWrapper className="w-full">
                <div className="py-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 h-10">
                            <SidebarButton />
                            <div className="flex gap-2 items-center max-w-[calc(100vw-165px)] overflow-x-auto whitespace-nowrap sm:text-xl font-semibold hide-scrollbar">
                                {t('views.title')}
                            </div>
                        </div>
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                            <button
                                onClick={() => setIsCreating(!isCreating)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                            >
                                <PlusCircle size={20} />
                            </button>
                        </div>
                    </div>

                    {isCreating && (
                        <div className="mt-4 p-4 border dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                            <h3 className="text-lg font-semibold mb-4">{t('views.createView')}</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">{t('views.viewName')}</label>
                                    <input
                                        type="text"
                                        value={newViewName}
                                        onChange={(e) => setNewViewName(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                        placeholder={t('views.viewName')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">{t('views.viewType')}</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="viewType"
                                                value="map"
                                                checked={newViewType === "map"}
                                                onChange={(e) => setNewViewType(e.target.value as ViewType)}
                                            />
                                            <MapPin size={16} />
                                            <span>{t('views.map')}</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="viewType"
                                                value="calendar"
                                                checked={newViewType === "calendar"}
                                                onChange={(e) => setNewViewType(e.target.value as ViewType)}
                                            />
                                            <Calendar size={16} />
                                            <span>{t('views.calendar')}</span>
                                        </label>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCreateView}
                                        disabled={createMutation.isPending}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                                    >
                                        {createMutation.isPending ? t('views.creating') : t('actions.create')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsCreating(false);
                                            setNewViewName("");
                                            setNewViewType("map");
                                        }}
                                        className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                    >
                                        {t('actions.cancel')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-4">
                        {isLoading ? (
                            <div className="text-center py-8">{t('common.loading')}</div>
                        ) : viewsList.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                {t('views.noViews')}
                            </div>
                        ) : (
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {viewsList.map((view) => (
                                    <div
                                        key={view.id}
                                        onClick={() => handleViewClick(view)}
                                        className="p-4 border dark:border-neutral-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-neutral-900 cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                {view.type === 'map' ? (
                                                    <MapPin size={20} className="text-blue-500" />
                                                ) : (
                                                    <Calendar size={20} className="text-green-500" />
                                                )}
                                                <div>
                                                    <h3 className="font-semibold">{view.name}</h3>
                                                    <p className="text-sm text-gray-500 capitalize">
                                                        {view.type === 'map' ? t('views.map') : t('views.calendar')}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteView(e, view.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title={t('views.deleteView')}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="mt-3 text-xs text-gray-400">
                                            <div>{t('views.createdBy')}: {view.created_by}</div>
                                            <div>{t('views.updatedAt')}: {new Date(view.updated_at).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </TransitionWrapper>
        </OneColumn>
    )
}

export default ViewsPage