import { create } from "zustand";
import { me } from "@/api/auth";
import { User } from "@/api/user";

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