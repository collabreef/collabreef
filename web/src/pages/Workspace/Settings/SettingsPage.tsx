import { useNavigate } from "react-router-dom"
import TransitionWrapper from "../../../components/transitionwrapper/TransitionWrapper"
import useCurrentWorkspaceId from "../../../hooks/useCurrentworkspaceId"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"
import { useWorkspaceStore } from "../../../stores/workspace"
import { deleteWorkspace, updateWorkspace } from "../../../api/workspace"
import { useEffect, useState } from "react"
import SidebarButton from "../../../components/sidebar/SidebarButton"

const Settings = () => {
    const currentWorkspaceId = useCurrentWorkspaceId()
    const { getWorkspaceById } = useWorkspaceStore()
    const [workspaceName, setWorkspaceName] = useState("")
    const { t } = useTranslation()
    const navigate = useNavigate()

    useEffect(() => {
        const workspace = getWorkspaceById(currentWorkspaceId)

        if (!workspace) {
            throw new Error("No workspace found");
        }

        setWorkspaceName(workspace.name)

    }, [currentWorkspaceId])

    const renameWorkspaceNameMutation = useMutation({
        mutationFn: () => updateWorkspace(currentWorkspaceId, {
            name: workspaceName
        })
    })

    const deleteWorkspaceMutation = useMutation({
        mutationFn: () => deleteWorkspace(currentWorkspaceId),
        onSuccess: () => {
            navigate("/")
        }
    })

    const handleDeleteClick = () => {
        if (confirm(t("pages.settings.deleteThisWorkspace")+"?")) {
            deleteWorkspaceMutation.mutate()
        }
    }

    const handleRenameClick = () => {
        renameWorkspaceNameMutation.mutate()
    }

    return <TransitionWrapper
        className="w-full"
    >
        <div className="flex flex-col min-h-screen">
            <div className="py-2 flex items-center justify-between ">
                <div className="flex gap-3 items-center sm:text-xl font-semibold h-10">
                    <SidebarButton />
                    {t("menu.settings")}
                </div>
            </div>
            <div className="grow flex justify-start">
                <div className="flex-1">
                    <div className="w-full">
                        <div className="bg-white dark:bg-neutral-900 rounded shadow-sm w-full p-5 max-w-3xl">
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-2 ">
                                    <div className="text-lg font-semibold">
                                        {t("pages.settings.workspaceName")}
                                    </div>
                                    <div className="flex gap-3 flex-wrap">
                                        <input className="flex-1 px-3 py-2 border rounded-lg" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} title="rename workspace" />
                                        <button onClick={handleRenameClick} className=" px-3 py-2 border shadow-sm rounded-lg">{t("actions.rename")}</button>
                                    </div>
                                </div>
                                <div className="flex gap-2 items-center justify-between">
                                    <div className="flex flex-col">
                                        <div className=" text-lg font-semibold">
                                            {t("pages.settings.deleteThisWorkspace")}
                                        </div>
                                    </div>
                                    <div>
                                        <button onClick={handleDeleteClick} className="px-3 py-2 border border-red-600 text-red-600 shadow-sm rounded-lg">{t("actions.delete")}</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </TransitionWrapper>
}

export default Settings