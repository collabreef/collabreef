import { create } from "zustand";
import { me } from "../api/auth";

export interface User {
  id: string;
  name: string;
  email: string;
  preferences: any;
}

interface CurrentUserStore {
  user: User | null;
  fetchUser: () => Promise<User | null>;
}

export const useCurrentUserStore = create<CurrentUserStore>((set) => ({
  user: null,
  fetchUser: async () => {
    try {
      const loginedUser = await me();
      set({ user: loginedUser });
      return loginedUser;
    } catch {
      set({ user: null });
      return null;
    }
  },
}));