import axios from 'axios';

export interface NoteData {
  id?: string;
  created_at?: string;
  blocks: Block[] | null;
  visibility?: string;
}

interface Block {
  type: string;
  data: any;
}

export const getNotes = async (workspaceId: string, pageNum: number, pageSize: number, query: string) => {
  const response = await axios.get(`/api/v1/workspaces/${workspaceId}/notes?pageSize=${pageSize}&pageNumber=${pageNum}&query=${query}`, { withCredentials: true });
  return response.data;
};

export const getNote = async (workspaceId: string, noteId: string) => {
  const response = await axios.get(`/api/v1/workspaces/${workspaceId}/notes/${noteId}`, { withCredentials: true });
  return response.data;
};

export const createNote = async (workspaceId: string, data: NoteData) => {
  const response = await axios.post(`/api/v1/workspaces/${workspaceId}/notes`, data);
  return response.data;
};

export const updateNote = async (workspaceId: string, data: NoteData) => {
  const response = await axios.put(`/api/v1/workspaces/${workspaceId}/notes/${data.id}`, data);
  return response.data;
};

export const deleteNote = async (workspaceId: string, id: string) => {
  const response = await axios.delete(`/api/v1/workspaces/${workspaceId}/notes/${id}`);
  return response.data;
}; 