import { create } from 'zustand';
import { getWorkspaces } from '@/api/workspace';

export interface Workspace {
  id: string;
  name: string;
}

interface WorkspaceStore {
  isFetched: boolean,
  workspaces: Workspace[];
  fetchWorkspaces: () => Promise<void>;
  getWorkspaceById: (id: string) => Workspace | undefined
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  isFetched: false,
  workspaces: [],
  fetchWorkspaces: async () => {
    try {
      const data = await getWorkspaces();
      set({
        workspaces: data,
        isFetched: true
      });
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    }
  },
  getWorkspaceById: (id) => {
    return get().workspaces.find((ws) => ws.id === id);
  },
  reset: () => {
    set({
      workspaces: [],
      isFetched: false
    })
  }
}));