import axios from 'axios';
import { WorkspaceData } from '../types/workspace';

export const createWorkspace = async (data: WorkspaceData) => {
  const response = await axios.post('/api/v1/workspaces', {
    name: data.name,
    description: data.description,
  });
  return response.data as WorkspaceData;
};

export const getWorkspace = async (id: string) => {
  const response = await axios.get(`/api/v1/workspaces/${id}`);
  return response.data;
};

export const getWorkspaces = async () => {
  const response = await axios.get('/api/v1/workspaces', { withCredentials: true });
  return response.data;
};

export const updateWorkspace = async (id: string, data: WorkspaceData) => {
  const response = await axios.put(`/api/v1/workspaces/${id}`, {
    withCredentials: true,
    name: data.name,
  });
  return response.data;
};

export const deleteWorkspace = async (id: string) => {
  const response = await axios.delete(`/api/v1/workspaces/${id}`, { withCredentials: true });
  return response.data;
};