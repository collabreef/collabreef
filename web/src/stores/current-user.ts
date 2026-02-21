import { create } from "zustand";
import { me } from "@/api/auth";
import { User } from "@/api/user";

interface CurrentUserStore {
  user: User | null;
  fetchUser: () => Promise<User | null>;
  resetCurrentUser: () => void;
}

export const useCurrentUserStore = create<CurrentUserStore>((set) => ({
  user: null,
  fetchUser: async () => {
    try {
      const loginedUser = await me();
      set({ user: loginedUser });
      if (loginedUser?.preferences) {
        const { lang, theme, primaryColor } = loginedUser.preferences;
        if (theme) localStorage.setItem("theme", theme);
        if (primaryColor) localStorage.setItem("primaryColor", primaryColor);
        if (lang) localStorage.setItem("i18nextLng", lang);
      }
      return loginedUser;
    } catch(e) {
      set({ user: null });
      return null;
    }
  },
  resetCurrentUser: () => {
    set({
      user: null,
    })
  }
}));