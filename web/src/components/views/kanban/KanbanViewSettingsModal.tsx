import { Dialog } from "radix-ui"
import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { View } from "@/types/view"
import { updateViewVisibility } from "@/api/view"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToastStore } from "@/stores/toast"

interface KanbanViewSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    view: View
    workspaceId: string
}

const KanbanViewSettingsModal = ({
    open,
    onOpenChange,
    view,
    workspaceId
}: KanbanViewSettingsModalProps) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { addToast } = useToastStore()

    const [visibility, setVisibility] = useState(view.visibility || "private")

    useEffect(() => {
        if (open) {
            setVisibility(view.visibility || "private")
        }
    }, [open, view.visibility])

    const visibilityMutation = useMutation({
        mutationFn: (newVisibility: string) => updateViewVisibility(workspaceId, view.id, newVisibility),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['view', workspaceId, view.id] })
            queryClient.invalidateQueries({ queryKey: ['views', workspaceId] })
        }
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            // Update visibility if changed
            if (visibility !== view.visibility) {
                await visibilityMutation.mutateAsync(visibility)
            }

            addToast({ type: 'success', title: t('views.settingsUpdated') || 'Settings updated successfully' })
            onOpenChange(false)
        } catch (error) {
            addToast({ type: 'error', title: t('views.settingsUpdateError') || 'Failed to update settings' })
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1000]" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[500px] z-[1001] max-h-[85vh] overflow-y-auto">
                    <Dialog.Title className="text-xl font-semibold mb-4">
                        {t('views.kanbanSettings') || 'Kanban Settings'}
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Visibility */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('common.visibility')}
                            </label>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="private"
                                        checked={visibility === "private"}
                                        onChange={(e) => setVisibility(e.target.value)}
                                    />
                                    <span className="text-sm">{t('visibility.private')}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="workspace"
                                        checked={visibility === "workspace"}
                                        onChange={(e) => setVisibility(e.target.value)}
                                    />
                                    <span className="text-sm">{t('visibility.workspace')}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="public"
                                        checked={visibility === "public"}
                                        onChange={(e) => setVisibility(e.target.value)}
                                    />
                                    <span className="text-sm">{t('visibility.public')}</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <Dialog.Close asChild>
                                <button
                                    type="button"
                                    className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    {t('common.cancel')}
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                disabled={visibilityMutation.isPending}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {visibilityMutation.isPending
                                    ? t('common.saving') || 'Saving...'
                                    : t('common.save')}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default KanbanViewSettingsModal
