import { Navigate, Outlet } from 'react-router-dom';
import { useCurrentUserStore } from '@/stores/current-user';

const RequireAuth = () => {
  const { user } = useCurrentUserStore();

  if (!user) {
    return <Navigate to="/explore/notes" replace />;
  }

  return <Outlet />;
}


export default RequireAuth;