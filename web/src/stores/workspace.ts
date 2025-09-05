import { create } from 'zustand';
import { getWorkspaces } from '../api/workspace';

export interface Workspace {
  id: string;
  name: string;
}

interface WorkspaceStore {
  workspaces: Workspace[];
  fetchWorkspaces: () => Promise<void>;
  getWorkspaceById: (id: string) => Workspace | undefined
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: [],
  fetchWorkspaces: async () => {
    try {
      const data = await getWorkspaces();
      set({
        workspaces: data,
      });
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    }
  },
  getWorkspaceById: (id) => {
    return get().workspaces.find((ws) => ws.id === id);
  },
}));