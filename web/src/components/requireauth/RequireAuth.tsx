import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useCurrentUserStore } from '../../stores/current-user';

const RequireAuth = () => {
  const [isChecking, setIsChecking] = useState(true)
  const { fetchUser } = useCurrentUserStore();
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      const currentUser = await fetchUser();
      if (!currentUser) {
        navigate("/signin");
      }

      setIsChecking(false)
    })();
  }, [])

  if (isChecking) {
    return <div className='w-screen h-dvh flex justify-center items-center'>
      <LoaderCircle className='animate-spin' />
    </div>;
  }

  return <Outlet />;
}


export default RequireAuth;