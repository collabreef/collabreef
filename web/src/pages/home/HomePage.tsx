import axios from "axios";
import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom"
import { useWorkspaceStore } from "../../stores/workspace";
import Loader from "../../components/loader/Loader";

const Home = () => {
    const { workspaces, fetchWorkspaces } = useWorkspaceStore()
    const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking");
    const [hasWorkspaces, setHasWorkspaces] = useState<boolean | null>(null);
    const location = useLocation();

    useEffect(() => {
        async function checkAuth() {
            try {
                const response = await axios.get('/api/v1/me', { withCredentials: true });
                const isAuthenticated = response.data.id != "" && !response.data.Disabled;

                if (!isAuthenticated) {
                    setAuthStatus("unauthenticated");
                    return;
                }

                await fetchWorkspaces();

                setAuthStatus("authenticated");
            }
            catch {
                setAuthStatus("unauthenticated");
            }
        }
        checkAuth()
    }, [])

    useEffect(() => {
        setHasWorkspaces(workspaces.length > 0);
    }, [workspaces]);

    if (authStatus === "checking") {
        return <div className='w-screen h-dvh flex justify-center items-center'>
            <Loader />
        </div>;
    }

    if (authStatus === "unauthenticated") {
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    if (!hasWorkspaces) {
        return <Navigate to="/workspace-setup" state={{ from: location }} replace />;
    }

    return <Navigate to={`/workspaces/${workspaces[0].id}`} />
}

export default Home