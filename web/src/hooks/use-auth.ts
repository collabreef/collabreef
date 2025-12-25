import { useEffect, useState } from 'react';
import { useCurrentUserStore } from '@/stores/current-user';
import i18n from '@/i18n';
import { useTheme } from '@/providers/Theme';

/**
 * Global authentication hook
 * Fetches user information and loads preferences on application startup
 *
 * @returns {Object} Contains user information and loading state
 * @returns {User | null} user - Current user information
 * @returns {boolean} isLoading - Whether user information is being loaded
 */
export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user, fetchUser } = useCurrentUserStore();
  const { theme, setTheme, primaryColor, setPrimaryColor } = useTheme()!;

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      try {
        const currentUser = await fetchUser();

        if (currentUser?.preferences) {
          // Load language preference
          if (currentUser.preferences.lang && i18n.language !== currentUser.preferences.lang) {
            i18n.changeLanguage(currentUser.preferences.lang);
          }

          // Load theme preference
          if (currentUser.preferences.theme && theme !== currentUser.preferences.theme) {
            setTheme(currentUser.preferences.theme);
          }

          // Load primary color preference
          if (currentUser.preferences.primaryColor && primaryColor !== currentUser.preferences.primaryColor) {
            setPrimaryColor(currentUser.preferences.primaryColor);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return {
    user,
    isLoading,
  };
};
