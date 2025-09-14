import { useNavigate, useParams } from "react-router-dom"
import { useEffect } from "react"
import { useWorkspaceStore, Workspace } from "../../stores/workspace"

const WorkspaceLoader = () => {
    const { isFetched, workspaces, fetchWorkspaces } = useWorkspaceStore()
    const { workspaceId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        (async () => {
            await fetchWorkspaces();
        })();
    }, [])

    useEffect(() => {
        if (!isFetched) return

        if (workspaces.length == 0) {
            navigate("/workspace-setup", { replace: true })
        }
        else if (!workspaceId && workspaces?.length > 0) {
            navigate(`/workspaces/${workspaces[0].id}`, { replace: true })
        }
    }, [workspaces])

    return <></>
}

export default WorkspaceLoader