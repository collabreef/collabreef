import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useCurrentUserStore } from '@/stores/current-user';
import i18n from '@/i18n';
import { useTheme } from '@/providers/Theme';

const RequireAuth = () => {
  const [isChecking, setIsChecking] = useState(true)
  const { fetchUser } = useCurrentUserStore();
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()!

  useEffect(() => {
    (async () => {
      const currentUser = await fetchUser();

      if (!currentUser) {
        navigate("/explore/notes");
        return;
      }

      //load preferences
      if (currentUser?.preferences) {
        if (i18n.language != currentUser.preferences.lang) {
          i18n.changeLanguage(currentUser.preferences.lang)
        }
        if (theme != currentUser.preferences.theme) {
          setTheme(currentUser.preferences.theme)
        }
      }
      
      setIsChecking(false)

      navigate("/workspaces");
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