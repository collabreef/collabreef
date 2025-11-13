import { ChevronsUpDown, Plus, Telescope, MonitorCog } from "lucide-react"
import { WorkspaceDropdown } from "../workspacedropdown/WorkspaceDropdown"
import { useWorkspaceStore } from "@/stores/workspace"
import { useMemo, useState } from "react"
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createWorkspace } from "@/api/workspace"
import { useSidebar } from "../sidebar/SidebarProvider"

const WorkspaceMenu = () => {
    const { workspaces, fetchWorkspaces, getWorkspaceById } = useWorkspaceStore()
    const { workspaceId } = useParams()
    const [keyword, setKeyword] = useState("")
    const navigate = useNavigate()
    const { t } = useTranslation()
    const { isCollapse } = useSidebar()

    const handleWorkspaceButtonClick = (id: string) => {
        if (id == workspaceId) return;
        navigate(`/workspaces/${id}`);
    }

    const handleNewWorkspaceButtonClick = async () => {
        try {
            const workspace = await createWorkspace({ name: keyword });
            if (workspace.id) {
                await fetchWorkspaces();
                navigate(`/workspaces/${workspace.id}`);
            }
        } catch (error) {
            console.error("Failed to create workspace:", error);
        }
    }

    const filteredWorkspaces = useMemo(() => {
        return keyword
            ? workspaces.filter((w) => w.name.includes(keyword))
            : workspaces;
    }, [workspaces, keyword]);

    return <WorkspaceDropdown
        className="w-full "
        buttonClassName=" bg-white dark:bg-neutral-700 shadow border dark:border-none w-full px-3 py-1.5 rounded-md text-sm flex justify-center items-center truncate"
        buttonTooltip={getWorkspaceById(workspaceId!)?.name ?? ""}
        buttonContent={<>
            {
                !isCollapse &&
                <span className="grow text-left truncate">
                    {getWorkspaceById(workspaceId!)?.name ?? ""}
                </span>
            }
            <span className="w-5">
                <ChevronsUpDown className="" size={16} />
            </span>
        </>}
    >
        <div className="px-2 pb-2">
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="border dark:border-none shadow-inner rounded-md w-full px-3 py-1 dark:bg-neutral-700 dark:text-neutral-100 " placeholder={t("placeholder.searchWorkspace")} />
        </div>
        <div className=" overflow-y-auto pb-2">
            {
                filteredWorkspaces && filteredWorkspaces.map(w => (
                    <>
                        <div className="px-2 text-sm text-ellipsis">
                            <button className="px-3 py-2 rounded w-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-left truncate" onClick={() => handleWorkspaceButtonClick(w.id)} >
                                {w.name}
                            </button>
                        </div>
                    </>
                ))
            }
            {
                keyword.length > 0 && <div className="px-2 text-sm whitespace-nowrap overflow-x-auto">
                    <button onClick={handleNewWorkspaceButtonClick} title="new workspace" className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center w-full gap-2">
                        <Plus size={16}></Plus>
                        {keyword ? t("menu.createWithName", { name: keyword }) : t("menu.addNew")}
                    </button>
                </div>
            }
        </div>
        <div className="border-t dark:border-neutral-700">
            <div className="px-2 pt-2 text-sm">
                <Link to={`/workspaces/${workspaceId}/settings`} className="px-3 py-2 rounded w-full hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-2">
                    <MonitorCog size={16} />
                    {t("menu.workspaceSettings")}
                </Link>
                <Link to="/explore/notes" className="px-3 py-2 rounded w-full hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center gap-2">
                    <Telescope size={16} />
                    {t("menu.explore")}
                </Link>
            </div>
        </div>
    </WorkspaceDropdown>
}

export default WorkspaceMenu