import { Dialog } from "radix-ui"
import { useTranslation } from "react-i18next"
import { useState, useEffect } from "react"
import { View } from "@/types/view"
import { updateView, updateViewVisibility } from "@/api/view"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useToastStore } from "@/stores/toast"
import VisibilitySelect from "@/components/visibilityselect/VisibilitySelect"

interface ViewSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    view: View
    workspaceId: string
}

const ViewSettingsModal = ({
    open,
    onOpenChange,
    view,
    workspaceId
}: ViewSettingsModalProps) => {
    const { t } = useTranslation()
    const queryClient = useQueryClient()
    const { addToast } = useToastStore()

    const [name, setName] = useState(view.name)
    const [visibility, setVisibility] = useState(view.visibility || "private")

    useEffect(() => {
        if (open) {
            setName(view.name)
            setVisibility(view.visibility || "private")
        }
    }, [open, view.name, view.visibility])

    const updateNameMutation = useMutation({
        mutationFn: (newName: string) => updateView(workspaceId, view.id, { name: newName }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['view', workspaceId, view.id] })
            queryClient.invalidateQueries({ queryKey: ['views', workspaceId] })
            queryClient.invalidateQueries({ queryKey: ['views', workspaceId, view.type] })
        }
    })

    const visibilityMutation = useMutation({
        mutationFn: (newVisibility: string) => updateViewVisibility(workspaceId, view.id, newVisibility),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['view', workspaceId, view.id] })
            queryClient.invalidateQueries({ queryKey: ['views', workspaceId] })
            queryClient.invalidateQueries({ queryKey: ['views', workspaceId, view.type] })
        }
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            let hasChanges = false

            // Update name if changed
            if (name.trim() && name !== view.name) {
                await updateNameMutation.mutateAsync(name.trim())
                hasChanges = true
            }

            // Update visibility if changed
            if (visibility !== view.visibility) {
                await visibilityMutation.mutateAsync(visibility)
                hasChanges = true
            }

            if (hasChanges) {
                addToast({ type: 'success', title: t('views.settingsUpdated') || 'Settings updated successfully' })
                onOpenChange(false)
            } else {
                onOpenChange(false)
            }
        } catch (error) {
            addToast({ type: 'error', title: t('views.settingsUpdateError') || 'Failed to update settings' })
        }
    }

    const isPending = updateNameMutation.isPending || visibilityMutation.isPending

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[1000]" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow-xl p-6 w-[90vw] max-w-[500px] z-[1001] max-h-[85vh] overflow-y-auto">
                    <Dialog.Title className="text-xl font-semibold mb-4">
                        {t('views.settings') || 'View Settings'}
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('common.name') || 'Name'}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border dark:border-neutral-600 bg-white dark:bg-neutral-800"
                                placeholder={t('views.enterName') || 'Enter view name'}
                                required
                            />
                        </div>

                        {/* Visibility */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t('common.visibility') || 'Visibility'}
                            </label>
                            <VisibilitySelect
                                value={visibility}
                                onChange={setVisibility}
                            />
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <Dialog.Close asChild>
                                <button
                                    type="button"
                                    className="px-4 py-2 border dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                >
                                    {t('common.cancel') || 'Cancel'}
                                </button>
                            </Dialog.Close>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? t('common.saving') || 'Saving...' : t('common.save') || 'Save'}
                            </button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export default ViewSettingsModal
