import SidebarButton from "../../components/sidebar/SidebarButton"
import TransitionWrapper from "../../components/transitionwrapper/TransitionWrapper"
import { useTranslation } from "react-i18next"
import { useCurrentUserStore } from "../../stores/current-user"
import { Plus, Search, Pencil, Trash2, X, Save } from "lucide-react"
import { GenCommand, ContainerType } from "../../types/user"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUserGenCommands, createUserGenCommand, updateUserGenCommand, deleteUserGenCommand } from "../../api/user"
import { useState } from "react"
import { useToastStore } from "../../stores/toast"
import { AIModality } from "../../types/ai"

const GenCommandsPage = () => {
    const { t } = useTranslation();
    const { user } = useCurrentUserStore()
    const queryClient = useQueryClient()
    const { addToast } = useToastStore()

    const [searchQuery, setSearchQuery] = useState("")
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [formData, setFormData] = useState<Omit<GenCommand, 'id'>>({
        name: "",
        container_type: "editorTextSelectionMenu",
        prompt: "",
        modality: "text2text",
        model: ""
    })

    // Fetch commands
    const { data: commands = [], isLoading } = useQuery({
        queryKey: ["userGenCommands", user?.id],
        queryFn: async () => {
            const result = await getUserGenCommands(user!.id);
            return result || [];
        },
        enabled: !!user?.id,
    })

    // Create mutation
    const createMutation = useMutation({
        mutationFn: (command: Omit<GenCommand, 'id'>) => createUserGenCommand(user!.id, command),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userGenCommands", user?.id] })
            addToast({ type: "success", title: t("pages.genCommands.createSuccess") })
            setIsCreating(false)
            resetForm()
        },
        onError: () => {
            addToast({ type: "error", title: t("pages.genCommands.createError") })
        }
    })

    // Update mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, command }: { id: string, command: Omit<GenCommand, 'id'> }) =>
            updateUserGenCommand(user!.id, id, command),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userGenCommands", user?.id] })
            addToast({ type: "success", title: t("pages.genCommands.updateSuccess") })
            setEditingId(null)
            resetForm()
        },
        onError: () => {
            addToast({ type: "error", title: t("pages.genCommands.updateError") })
        }
    })

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteUserGenCommand(user!.id, id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userGenCommands", user?.id] })
            addToast({ type: "success", title: t("pages.genCommands.deleteSuccess") })
        },
        onError: () => {
            addToast({ type: "error", title: t("pages.genCommands.deleteError") })
        }
    })

    const resetForm = () => {
        setFormData({
            name: "",
            container_type: "editorTextSelectionMenu",
            prompt: "",
            modality: "text2text",
            model: ""
        })
    }

    const handleEdit = (command: GenCommand) => {
        setEditingId(command.id!)
        setFormData({
            name: command.name,
            container_type: command.container_type,
            prompt: command.prompt,
            modality: command.modality,
            model: command.model
        })
        setIsCreating(false)
    }

    const handleSave = () => {
        if (!formData.name || !formData.prompt || !formData.model) {
            addToast({ type: "error", title: t("pages.genCommands.fillRequired") })
            return
        }

        if (editingId) {
            updateMutation.mutate({ id: editingId, command: formData })
        } else if (isCreating) {
            createMutation.mutate(formData)
        }
    }

    const handleCancel = () => {
        setEditingId(null)
        setIsCreating(false)
        resetForm()
    }

    const handleDelete = (id: string) => {
        if (window.confirm(t("pages.genCommands.confirmDelete"))) {
            deleteMutation.mutate(id)
        }
    }

    const filteredCommands = commands.filter(cmd =>
        cmd.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const renderCommandForm = (command?: GenCommand) => {
        const isEditing = command && editingId === command.id
        const isNew = isCreating && !command

        if (!isEditing && !isNew && command) {
            return (
                <div key={command.id} className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm w-full p-5">
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col flex-1">
                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {t("pages.genCommands.name")}
                                </div>
                                <div className="text-base mt-1">{command.name}</div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(command)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded"
                                    aria-label="edit"
                                >
                                    <Pencil size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(command.id!)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded text-red-600"
                                    aria-label="delete"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                {t("pages.genCommands.containerType")}
                            </div>
                            <div className="text-base mt-1">{command.container_type}</div>
                        </div>

                        <div className="flex flex-col">
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                {t("pages.genCommands.prompt")}
                            </div>
                            <div className="text-base mt-1 whitespace-pre-wrap bg-gray-50 dark:bg-neutral-900 p-3 rounded">
                                {command.prompt}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="flex flex-col flex-1">
                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {t("pages.genCommands.genType")}
                                </div>
                                <div className="text-base mt-1">{command.modality}</div>
                            </div>
                            <div className="flex flex-col flex-1">
                                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {t("pages.genCommands.model")}
                                </div>
                                <div className="text-base mt-1">{command.model}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        // Edit or Create form
        if (isEditing || isNew) {
            return (
                <div key={isNew ? "new" : command?.id} className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm w-full p-5 border-2 border-amber-500">
                    <div className="flex flex-col gap-4  w-full min-w-0">
                        <div className="flex justify-between items-center  w-full min-w-0">
                            <div className="font-semibold">
                                {isNew ? t("pages.genCommands.createNew") : t("pages.genCommands.editing")}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-1 px-3 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
                                    aria-label="save"
                                >
                                    <Save size={16} />
                                    {t("actions.save")}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-1 px-3 py-2 bg-gray-200 dark:bg-neutral-700 rounded hover:bg-gray-300 dark:hover:bg-neutral-600"
                                    aria-label="cancel"
                                >
                                    <X size={16} />
                                    {t("actions.cancel")}
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                {t("pages.genCommands.name")} *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="border dark:border-neutral-600 p-2 rounded bg-transparent"
                                placeholder={t("pages.genCommands.namePlaceholder")}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                {t("pages.genCommands.containerType")} *
                            </label>
                            <select
                                value={formData.container_type}
                                onChange={(e) => setFormData({ ...formData, container_type: e.target.value as ContainerType })}
                                className="border dark:border-neutral-600 p-2 rounded bg-transparent"
                                aria-label="container type"
                            >
                                <option value="editorTextSelectionMenu">Editor Text Selection Menu</option>
                                <option value="editorImageSelectionMenu">Editor Image Selection Menu</option>
                                <option value="notePageMenu">Note Page Menu</option>
                            </select>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                {t("pages.genCommands.prompt")} *
                            </label>
                            <textarea
                                value={formData.prompt}
                                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                className="border dark:border-neutral-600 p-3 rounded resize-none h-32 bg-transparent"
                                placeholder={t("pages.genCommands.promptPlaceholder")}
                                aria-label="prompt textarea"
                            />
                        </div>

                        <div className="flex gap-3 w-full min-w-0">
                            <div className="flex flex-col flex-1 w-full min-w-0">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                    {t("pages.genCommands.genType")} *
                                </label>
                                <select
                                    value={formData.modality}
                                    onChange={(e) => setFormData({ ...formData, modality: e.target.value as AIModality })}
                                    className="border dark:border-neutral-600 p-2 rounded bg-transparent"
                                    aria-label="output type"
                                >
                                    <option value="text2text">text-to-text</option>
                                    <option value="text2image">text-to-image</option>
                                    <option value="textimage2text">text-and-image-to-text</option>
                                    <option value="textimage2image">text-and-image-to-image</option>
                                </select>
                            </div>
                            <div className="flex flex-col flex-1  w-full min-w-0">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                    {t("pages.genCommands.model")} *
                                </label>
                                <input
                                    type="text"
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                    className="border dark:border-neutral-600 p-2 rounded bg-transparent"
                                    placeholder="gpt-4o"
                                    aria-label="model"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )
        }

        return null
    }

    return <TransitionWrapper className="w-full">
        <div className="flex flex-col min-h-screen">
            <div className="py-2.5 flex items-center justify-between">
                <div className="flex gap-3 items-center sm:text-xl font-semibold h-10">
                    <SidebarButton />
                    {t("menu.gencommands")}
                </div>
            </div>
            <div className="grow flex justify-start pb-6 w-full min-w-0">
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-4 max-w-3xl  w-full min-w-0">
                        <div className="flex items-center gap-2 w-full min-w-0">
                            <div className="flex-1  w-full min-w-0 bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-600 p-3 flex items-center gap-2">
                                <div>
                                    <Search size={16} />
                                </div>
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 min-w-0 shrink bg-transparent outline-none"
                                    placeholder={t("pages.genCommands.searchPlaceholder")}
                                    aria-label="search command"
                                />
                            </div>
                            <div className="">
                                <button
                                    onClick={() => {
                                        setIsCreating(true)
                                        setEditingId(null)
                                        resetForm()
                                    }}
                                    className=" whitespace-nowrap flex gap-2 items-center px-4 py-3 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                                    disabled={isCreating}
                                >
                                    <Plus size={16} />
                                    {t("actions.new")}
                                </button>
                            </div>
                        </div>

                        {isLoading && (
                            <div className="text-center py-8 text-gray-500">
                                {t("common.loading")}
                            </div>
                        )}

                        {isCreating && renderCommandForm()}

                        {filteredCommands.map(command => renderCommandForm(command))}

                        {!isLoading && filteredCommands.length === 0 && !isCreating && (
                            <div className="text-center py-8 text-gray-500">
                                {searchQuery ? t("pages.genCommands.noResults") : t("pages.genCommands.empty")}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </TransitionWrapper>
}

export default GenCommandsPage