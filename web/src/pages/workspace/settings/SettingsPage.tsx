import { useNavigate } from "react-router-dom"
import useCurrentWorkspaceId from "@/hooks/use-currentworkspace-id"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { useWorkspaceStore } from "@/stores/workspace"
import { deleteWorkspace, updateWorkspace } from "@/api/workspace"
import { useEffect, useState } from "react"
import SidebarButton from "@/components/sidebar/SidebarButton"
import { Loader, Trash, Trash2 } from "lucide-react"
import OneColumn from "@/components/onecolumn/OneColumn"

const Settings = () => {
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { isFetched, resetWorkspaces, getWorkspaceById } = useWorkspaceStore()
    const [workspaceName, setWorkspaceName] = useState("")
    const [isRenaming, SetIsRenaming] = useState(false)
    const { t } = useTranslation()
    const navigate = useNavigate()

    useEffect(() => {
        if (!isFetched) return;

        const workspace = getWorkspaceById(currentWorkspaceId)

        if (!workspace) {
            throw new Error("No workspace found");
        }

        setWorkspaceName(workspace.name)

    }, [currentWorkspaceId])

    const renameWorkspaceNameMutation = useMutation({
        mutationFn: () => updateWorkspace(currentWorkspaceId, {
            name: workspaceName
        }),
        onSuccess: () => {
            resetWorkspaces()
            setTimeout(() => {
                SetIsRenaming(false)
            }, 200)
        }
    })

    const deleteWorkspaceMutation = useMutation({
        mutationFn: () => deleteWorkspace(currentWorkspaceId),
        onSuccess: () => {
            resetWorkspaces()
            navigate("/")
        }
    })

    const handleDeleteClick = () => {
        if (confirm(t("pages.settings.deleteThisWorkspaceMessage"))) {
            deleteWorkspaceMutation.mutate()
        }
    }

    const handleRenameClick = () => {
        SetIsRenaming(true)
        renameWorkspaceNameMutation.mutate()
    }

    return <OneColumn>

        <div
            className="w-full"
        >
            <div className="flex flex-col min-h-screen">
                <div className="py-2.5 flex items-center justify-between ">
                    <div className="flex gap-3 items-center sm:text-xl font-semibold h-10">
                        <SidebarButton />
                        {t("menu.workspaceSettings")}
                    </div>
                </div>
                <div className="grow flex justify-start">
                    <div className="flex-1">
                        <div className="w-full">
                            <div className="bg-white dark:bg-neutral-800 rounded shadow-sm w-full p-5 max-w-3xl">
                                <div className="flex flex-col gap-6">
                                    <div className="flex flex-col gap-2 ">
                                        <div className="text-lg font-semibold">
                                            {t("pages.settings.workspaceName")}
                                        </div>
                                        <div className="flex gap-3 flex-wrap">
                                            <input className="flex-1 px-3 py-2 border dark:border-none rounded-lg dark:bg-neutral-700" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} title="rename workspace" />
                                            <button onClick={handleRenameClick} className=" px-3 py-2 border dark:border-none shadow-sm rounded-lg text-white bg-black">
                                                {isRenaming ? <Loader size={16} className="animate-spin" /> : t("actions.rename")}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-center justify-between">
                                        <div className="flex flex-col">
                                            <div className=" text-lg font-semibold">
                                                {t("pages.settings.deleteThisWorkspace")}
                                            </div>
                                        </div>
                                        <div>
                                            <button onClick={handleDeleteClick} className="p-3 text-white bg-red-600 shadow-sm rounded-lg" aria-label="delete">
                                                <Trash2 size={16} />
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
}

export default Settings