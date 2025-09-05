import { ChevronsUpDown, Plus } from "lucide-react"
import { Dropdown } from "../dropdown/Dropdown"
import DropdownItem from "../dropdown/DropdownItem"
import { useWorkspaceStore } from "../../stores/workspace"
import { useMemo, useState } from "react"
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createWorkspace } from "../../api/workspace"
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

    return <Dropdown
        className="w-full "
        buttonClassName=" bg-white dark:bg-neutral-900 shadow border w-full px-3 py-1.5 rounded-md text-sm flex justify-center items-center truncate"
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
        <DropdownItem className="px-2 pb-1">
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="border shadow-inner rounded-md w-full px-3 py-1 dark:bg-neutral-800 dark:text-neutral-100 " placeholder={t("placeholder.searchWorkspace")} />
        </DropdownItem>
        <div className=" overflow-y-auto">
            {
                filteredWorkspaces && filteredWorkspaces.map(w => (
                    <>
                        <DropdownItem className="px-2 text-sm text-ellipsis">
                            <button className="px-3 py-2 rounded w-full hover:bg-neutral-200 dark:hover:bg-neutral-700 text-left truncate" onClick={() => handleWorkspaceButtonClick(w.id)} >
                                {w.name}
                            </button>
                        </DropdownItem>
                    </>
                ))
            }
            {
                keyword.length > 0 && <DropdownItem className="px-2 text-sm whitespace-nowrap overflow-x-auto">
                    <button onClick={handleNewWorkspaceButtonClick} title="new workspace" className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center w-full gap-2">
                        <Plus size={16}></Plus>
                        {keyword ? t("menu.createWithName", { name: keyword }) : t("menu.addNew")}
                    </button>
                </DropdownItem>
            }
        </div>
    </Dropdown>
}

export default WorkspaceMenu