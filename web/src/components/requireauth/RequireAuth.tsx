import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useCurrentUserStore } from '../../stores/current-user';
import i18n from '../../i18n';

const RequireAuth = () => {
  const [isChecking, setIsChecking] = useState(true)
  const { fetchUser } = useCurrentUserStore();
  const navigate = useNavigate()

  useEffect(() => {
    (async () => {
      const currentUser = await fetchUser();

      if (!currentUser) {
        navigate("/explore/notes");
      }

      //load preferences
      if (currentUser?.preferences) {
        if (i18n.language != currentUser.preferences.lang) {
          i18n.changeLanguage(currentUser.preferences.lang)
        }
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